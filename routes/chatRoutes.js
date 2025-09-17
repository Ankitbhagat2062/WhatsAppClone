import express from 'express';
import chatController from '../Controllers/chatController.js';
import authMiddleware from '../Middleware/authMiddleware.js';
import { multerMiddleware } from '../Config/cloudinaryConfig.js';

const router = express.Router();

// Auth routes
router.post("/send-message", authMiddleware,multerMiddleware, chatController.sendMessages);
router.post("/add-reactions", authMiddleware,multerMiddleware, chatController.addReactions);
router.get("/conversations",authMiddleware, chatController.getConversation);
router.get("/conversations/:conversationId/messages",authMiddleware, chatController.getMessages);


// Protect routes
router.put("/messages/read",authMiddleware,chatController.markAsRead);

router.delete("/messages/:messageId",authMiddleware,chatController.deleteMessage);

export default router;