// controllers/scheduledMeeting.controller.js
import { ScheduledMeeting } from '../models/scheduledMeeting.model.js';
import { Adoption } from '../models/adoption.model.js';
import { PetModel } from '../models/pet.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

// Admin: Schedule a meeting for an adoption
export const scheduleAdoptionMeeting = async (req, res) => {
    try {
        const {
            adoptionId,
            scheduledDate,
            scheduledTime,
            location,
            notes,
            adminMessage
        } = req.body;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(adoptionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid adoption ID format'
            });
        }

        // Find the adoption application
        const adoption = await Adoption.findById(adoptionId);
        if (!adoption) {
            return res.status(404).json({
                success: false,
                message: 'Adoption application not found'
            });
        }

        // Check if the adoption status is 'pending'
        if (adoption.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot schedule a meeting for an adoption with status '${adoption.status}'`
            });
        }

        // Check if there is already a pending meeting for this adoption
        const existingMeeting = await ScheduledMeeting.findOne({
            adoptionId,
            status: 'pending'
        });

        if (existingMeeting) {
            return res.status(400).json({
                success: false,
                message: 'There is already a pending meeting for this adoption'
            });
        }

        // Create the scheduled meeting
        const meeting = new ScheduledMeeting({
            adoptionId,
            userId: adoption.user,
            petId: adoption.petId,
            petName: adoption.petName,
            scheduledDate,
            scheduledTime,
            location,
            notes,
            adminMessage
        });

        await meeting.save();

        res.status(201).json({
            success: true,
            message: 'Meeting scheduled successfully',
            meeting
        });
    } catch (error) {
        console.error('Error scheduling meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule meeting',
            error: error.message
        });
    }
};

// User: Get user's scheduled meetings
export const getUserScheduledMeetings = async (req, res) => {
    try {
        const meetings = await ScheduledMeeting.find({ userId: req.userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            meetings
        });
    } catch (error) {
        console.error('Error fetching user meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meetings',
            error: error.message
        });
    }
};

// User: Respond to meeting invitation
export const respondToMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { status } = req.body;

        // Validate status
        if (status !== 'accepted' && status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be either "accepted" or "rejected"'
            });
        }

        // Find the meeting
        const meeting = await ScheduledMeeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Verify the user owns this meeting
        if (meeting.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to respond to this meeting'
            });
        }

        // Check if the meeting is still pending
        if (meeting.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot respond to a meeting with status '${meeting.status}'`
            });
        }

        // Update meeting status
        meeting.status = status;
        meeting.responseDate = new Date();
        await meeting.save();

        // Get the adoption
        const adoption = await Adoption.findById(meeting.adoptionId);
        if (!adoption) {
            return res.status(404).json({
                success: false,
                message: 'Associated adoption not found'
            });
        }

        // Update adoption and pet status based on response
        if (status === 'accepted') {
            // Move to in_review if accepted
            adoption.status = 'in_review';
            await adoption.save();

            // Update pet status in PostgreSQL
            await PetModel.updateAdoptionStatus(meeting.petId, 'pending');

        } else if (status === 'rejected') {
            // Reject the adoption if meeting is rejected
            adoption.status = 'rejected';
            adoption.adminNotes = adoption.adminNotes
                ? `${adoption.adminNotes}\n\nUser rejected scheduled meeting on ${new Date().toLocaleString()}.`
                : `User rejected scheduled meeting on ${new Date().toLocaleString()}.`;
            await adoption.save();

            // Make pet available again
            await PetModel.updateAdoptionStatus(meeting.petId, 'available');
        }

        res.status(200).json({
            success: true,
            message: `Meeting ${status} successfully`,
            meeting
        });
    } catch (error) {
        console.error('Error responding to meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to meeting',
            error: error.message
        });
    }
};

// Admin: Get all scheduled meetings
export const getAllScheduledMeetings = async (req, res) => {
    try {
        const { status } = req.query;

        // Build filter
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Fetch meetings with user data
        const meetings = await ScheduledMeeting.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            meetings
        });
    } catch (error) {
        console.error('Error fetching all meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meetings',
            error: error.message
        });
    }
};

// Admin: Get meeting details
export const getMeetingDetails = async (req, res) => {
    try {
        const { meetingId } = req.params;

        // Find meeting with user data
        const meeting = await ScheduledMeeting.findById(meetingId)
            .populate('userId', 'name email');

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Get associated adoption
        const adoption = await Adoption.findById(meeting.adoptionId);

        res.status(200).json({
            success: true,
            meeting,
            adoption
        });
    } catch (error) {
        console.error('Error fetching meeting details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meeting details',
            error: error.message
        });
    }
};

// Admin: Update a meeting
export const updateMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const {
            scheduledDate,
            scheduledTime,
            location,
            notes,
            adminMessage,
            status
        } = req.body;

        // Find the meeting
        const meeting = await ScheduledMeeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Update fields if provided
        if (scheduledDate) meeting.scheduledDate = scheduledDate;
        if (scheduledTime) meeting.scheduledTime = scheduledTime;
        if (location) meeting.location = location;
        if (notes !== undefined) meeting.notes = notes;
        if (adminMessage !== undefined) meeting.adminMessage = adminMessage;

        // Status can only be updated by admin, not by responding to meeting
        if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
            // Only update if status is changing
            if (meeting.status !== status) {
                const oldStatus = meeting.status;
                meeting.status = status;
                meeting.responseDate = new Date();

                // Handle adoption status changes when admin manually changes meeting status
                const adoption = await Adoption.findById(meeting.adoptionId);

                if (adoption) {
                    if (status === 'accepted' && oldStatus !== 'accepted') {
                        // Move to in_review if accepted
                        adoption.status = 'in_review';
                        await adoption.save();
                        await PetModel.updateAdoptionStatus(meeting.petId, 'pending');
                    } else if (status === 'rejected' && oldStatus !== 'rejected') {
                        // Reject the adoption if meeting is rejected
                        adoption.status = 'rejected';
                        adoption.adminNotes = adoption.adminNotes
                            ? `${adoption.adminNotes}\n\nMeeting marked as rejected by admin on ${new Date().toLocaleString()}.`
                            : `Meeting marked as rejected by admin on ${new Date().toLocaleString()}.`;
                        await adoption.save();
                        await PetModel.updateAdoptionStatus(meeting.petId, 'available');
                    }
                }
            }
        }

        await meeting.save();

        res.status(200).json({
            success: true,
            message: 'Meeting updated successfully',
            meeting
        });
    } catch (error) {
        console.error('Error updating meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update meeting',
            error: error.message
        });
    }
};

// Admin: Delete a meeting
export const deleteMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;

        // Find the meeting
        const result = await ScheduledMeeting.findByIdAndDelete(meetingId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Meeting deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete meeting',
            error: error.message
        });
    }
};