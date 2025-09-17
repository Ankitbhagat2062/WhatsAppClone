import Conversation from "../models/Conversation.js";
import Response from "../utills/responseHandler.js";
import Message from "../models/Messages.js";
import {uploadFileToCloudinary} from '../Config/cloudinaryConfig.js'


const sendMessages = async (req, res) => {
    try {
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;

        const participants = [senderId, receiverId].sort();
        // Check If conversation already exists
        let conversation = await Conversation.findOne({
            participants: participants
        });
        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        let imageOrVideoUrl = null
        let contentType = null
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            console.log(uploadFile)
            if (!uploadFile?.secure_url) {
                return Response(res, 400, "Error uploading file");
            }
            imageOrVideoUrl = uploadFile?.secure_url;
            if (file.mimetype.startsWith("image")) {
                contentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                contentType = "video";
            } else {
                return Response(res, 400, "Unsupported file type");
            }
        } else if (content?.trim()) {
            contentType = "text";
        } else {
            return Response(res, 400, "Message Content or file is required");
        }
        const message = new Message({
            conversation: conversation?.id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus
        });

        await message.save();
        if (message?.content) {
            conversation.lastMessage = message?._id;
        }
        conversation.unread += 1;
        await conversation.save();

        const populateMessage = await Message.findOne(message?._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")

        //Emit Socket Event  for  Real Time
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiverId);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("receive_message", populateMessage);
                message.messageStatus = "delivered";
                await message.save();
            }
        }
        return Response(res, 200, "Message sent successfully", populateMessage);
    }
    catch (error) {
        console.error("Error sending message:", error);
        return Response(res, 500, "Internal server error");
    }
}

const addReactions = async (req, res) => {
    const { messageId, reaction } = req.body;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return Response(res, 404, "Message not found");
        }

        // Update reactions
        if (reaction) {
            const existingIndex = message.reactions.findIndex(
                r => r.user.toString() === req.user.id
            );

            if (existingIndex > -1) {
                // If the reaction already exists, update it
                message.reactions[existingIndex].emoji = reaction;
            } else {
                // If it doesn't exist, add a new reaction
                message.reactions.push({ user: req.user.id, emoji: reaction });
            }
        }

        await message.save();
        return Response(res, 200, "Message updated successfully", message);
    } catch (error) {
        console.error("Error updating message:", error);
        return Response(res, 500, "Internal server error");
    }
}

const getConversation = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId
        }).populate("participants", "username profilePicture isOnline lastSeen")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture"
                }
            }).sort({ createdAt: -1 });
        return Response(res, 200, "Conversations fetched successfully", conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return Response(res, 500, "Internal server error");
    }
}


// Get Messages of a 
import mongoose from "mongoose";

const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return Response(res, 400, "Invalid conversation ID");
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return Response(res, 404, "Conversation not found");
        }

        if (!conversation.participants.some(p => p.toString() === userId)) {
            return Response(res, 403, "Access denied");
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort("createdAt");

        await Message.updateMany(
            { conversation: conversationId, receiver: userId, messageStatus: { $in: ["send", "delivered"] } },
            { $set: { messageStatus: "read" } }
        );

        conversation.unread = 0;
        await conversation.save();
        return Response(res, 200, "Messages fetched successfully", messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return Response(res, 500, "Internal server error");
    }
};


const markAsRead = async (req, res) => { 
    let { messageIds } = req.body;
    const userId = req.user.id;

    // Ensure messageIds is an array
    if (!Array.isArray(messageIds)) {
        messageIds = [messageIds];
    }

    try {
        let messages = await Message.find({
            _id: { $in: messageIds },
            receiver: userId
        });

        if (!messages.length) {
            return Response(res, 200, "No matching messages found", []);
        }

        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

        // Notify original sender
        if (req.io && req.socketUserMap) {
            for (const message of messages) {
                const senderSocketId = req.socketUserMap.get(message.sender.toString());
                if (senderSocketId) {
                    req.io.to(senderSocketId).emit("message_read", {
                        _id: message._id,
                        messageStatus: "read"
                    });
                }
            }
        }

        return Response(res, 200, "Messages marked as read", messages);
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return Response(res, 500, "Internal server error");
    }
}

import { v2 as cloudinary } from "cloudinary";

// helper: extract public_id from Cloudinary URL
const getCloudinaryPublicId = (url) => {
  if (!url) return null;
  // example: https://res.cloudinary.com/<cloud>/video/upload/v1756372541/pt6d8q8chppsriv4q7nt.mp4
  const parts = url.split("/");
  const fileWithExt = parts[parts.length - 1]; // pt6d8q8chppsriv4q7nt.mp4
  return fileWithExt.split(".")[0];            // pt6d8q8chppsriv4q7nt
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return Response(res, 404, "Message not found");
    }

    if (message.sender.toString() !== userId) {
      return Response(res, 403, "You are not authorized to delete this message");
    }

    // 🗑️ Delete media from Cloudinary if exists
    if (message.imageOrVideoUrl) {
      const publicId = getCloudinaryPublicId(message.imageOrVideoUrl);
      if (publicId) {
        const resourceType = message.contentType === "video" ? "video" : "image";
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`✅ Cloudinary file deleted: ${publicId}`);
      }
    }

    // delete the message document
    await Message.deleteOne({ _id: messageId });
    console.log("Message deleted:", message);

    // Update conversation's lastMessage if needed
    const conversation = await Conversation.findById(message.conversation);
    let updatedConversation = null;

    if (conversation && conversation.lastMessage?.toString() === messageId) {
      const newLastMessage = await Message.findOne({ conversation: message.conversation })
        .sort({ createdAt: -1 });
      conversation.lastMessage = newLastMessage ? newLastMessage._id : null;
      await conversation.save();
      updatedConversation = conversation;
    }

    // Emit Socket Events
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
      const senderSocketId = req.socketUserMap.get(message.sender.toString());

      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted", messageId);
      }
      if (senderSocketId && senderSocketId !== receiverSocketId) {
        req.io.to(senderSocketId).emit("message_deleted", messageId);
      }

      if (updatedConversation) {
        const populatedConversation = await Conversation.findById(updatedConversation._id)
          .populate("participants", "username profilePicture isOnline lastSeen")
          .populate({
            path: "lastMessage",
            populate: {
              path: "sender receiver",
              select: "username profilePicture"
            }
          });

        if (receiverSocketId) {
          req.io.to(receiverSocketId).emit("conversation_updated", populatedConversation);
        }
        if (senderSocketId && senderSocketId !== receiverSocketId) {
          req.io.to(senderSocketId).emit("conversation_updated", populatedConversation);
        }
      }
    }

    return Response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error("Error deleting message:", error);
    return Response(res, 500, "Internal server error");
  }
};



export default { sendMessages, addReactions, getConversation, getMessages, markAsRead, deleteMessage };
