// routes/scheduledMeeting.routes.js
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import {
    scheduleAdoptionMeeting,
    getUserScheduledMeetings,
    respondToMeeting,
    getAllScheduledMeetings,
    getMeetingDetails,
    updateMeeting,
    deleteMeeting
} from '../controllers/scheduledMeeting.controller.js';

const router = express.Router();

// User routes
router.get('/user', verifyToken, getUserScheduledMeetings);
router.put('/respond/:meetingId', verifyToken, respondToMeeting);

// Admin routes
router.post('/admin', verifyToken, isAdmin, scheduleAdoptionMeeting);
router.get('/admin', verifyToken, isAdmin, getAllScheduledMeetings);
router.get('/admin/:meetingId', verifyToken, isAdmin, getMeetingDetails);
router.put('/admin/:meetingId', verifyToken, isAdmin, updateMeeting);
router.delete('/admin/:meetingId', verifyToken, isAdmin, deleteMeeting);

export default router;