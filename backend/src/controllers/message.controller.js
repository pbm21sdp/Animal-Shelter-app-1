import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';
import {sendMessageReplyEmail} from "../config/mailtrap/emails.js";

// Create a new message
export const createMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Email and message are required'
            });
        }

        if (message.length > 1800) {
            return res.status(400).json({
                success: false,
                message: 'Message cannot exceed 1800 characters'
            });
        }

        // Check if the email exists in our user database
        const user = await User.findOne({ email });

        // Set the name - prioritize:
        // 1. Name provided in the request
        // 2. Name from the user record (if exists)
        // 3. Empty string (frontend will handle display appropriately)

        const messageName = name || (user ? user.name : '');

        // Create message object
        const newMessage = new Message({
            name: messageName,
            email,
            message,
            userId: user ? user._id : null
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully'
        });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// Get all messages (admin only)
export const getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'name email');

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// Mark message as read (admin only)
export const markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID format'
            });
        }

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        message.read = true;
        await message.save();

        res.status(200).json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking message as read',
            error: error.message
        });
    }
};

// Delete a message (admin only)
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID format'
            });
        }

        const message = await Message.findByIdAndDelete(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting message',
            error: error.message
        });
    }
};

// Reply to a message (admin only)
export const replyToMessage = async (req, res) => {
    try {
        const { messageId, email, replyText } = req.body;

        if (!messageId || !email || !replyText) {
            return res.status(400).json({
                success: false,
                message: 'Message ID, email, and reply text are required'
            });
        }

        // Find the message to get the original content
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Send the reply email
        await sendMessageReplyEmail(email, message.message, replyText);

        // Mark the message as read
        message.read = true;
        await message.save();

        res.status(200).json({
            success: true,
            message: 'Reply sent successfully'
        });
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending reply',
            error: error.message
        });
    }
};

export const getUserMessages = async (req, res) => {
    try {
        // Find messages for the authenticated user
        const messages = await Message.find({
            $or: [
                { userId: req.userId },
                { email: req.user?.email }  // Also match by email in case messages were sent before user registration
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching user messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};



