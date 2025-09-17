import { createServer } from "http";
import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Messages.js";
// import handleVideoCallEvent from "./video-call-events.js";
import VideoCallEvent from "./video-call-events.js";


///Map to store online users
const onlineUsers = new Map();
const typingUsers = new Map();

const initializeSocket = async (server) => {
    const io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        },
        pingTimeout: 60 * 1000,
        pingInterval: 25000,
    });

    //When a new user connects
    io.on("connection", (socket) => {
        console.log("New user socketService :", socket.id);
        let userId = null;

        //Handle user connection and mark them as online
        socket.on("user_connected", async (connectinguserid) => {
            try {
                userId = connectinguserid;
                socket.userId = userId;
                onlineUsers.set(userId, socket.id);
                socket.join(userId); //Join the user to their room

                //Update user status to online
                await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

                //Notify all users that this user is online
                io.emit("user_status", { userId, isOnline: true });
            } catch (error) {
                console.error("Error handling user connection:", error);
            }
        });

        //Return Online Status of requested user
        socket.on("get_user_status", (requestedUserId, callback) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callback({ userId: requestedUserId, isOnline, lastSeen: isOnline ? new Date() : null });
        });

        // Forward Message to receiver if Online
        socket.on("send_message", async (message) => {
            try {
                // Handle both message.receiver._id and message.receiver (string ID)
                const receiverId = message.receiver?._id || message.receiver;
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive_message", message);
                }
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("message_error", "Failed to send message");
            }
        });


        // Update Message as read and notify sender
        socket.on("message_read", async (messageIds, senderId) => {
            try {
                // Update the message status in the database
                await Message.updateMany({ _id: { $in: messageIds } }, { messageStatus: true });

                // Notify the sender that their message has been read
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    messageIds.forEach(messageId => {
                        io.to(senderSocketId).emit("message_status_update", { messageId, messageStatus: true });
                    });
                }
            } catch (error) {
                console.error("Error marking message as read:", error);
            }
        });


        // Handle Typing start Event
        socket.on("typing_start", (conversationId) => {
            typingUsers.set(conversationId, true);
            socket.broadcast.emit("user_typing", { conversationId, isTyping: true });
        });

        // Handle Typing start and auto-stop Event
        socket.on("typing_stop", (conversationId, receiverId) => {
            if (!userId || !conversationId || !receiverId) return;

            if (typingUsers.has(userId)) typingUsers.set(userId, {});

            const userTyping = typingUsers.get(userId);

            userTyping[conversationId] = true;

            // Clear any existing timeout
            if (userTyping[`${conversationId}_timout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`]);
            }

            // Auto stop after 3 second
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false;
                socket.to(receiverId).emit("user_typing", { userId, conversationId, isTyping: false });
            }, 3000);

            // Notify the receiver that the user is typing
            socket.to(receiverId).emit("user_typing", { userId, conversationId, isTyping: true });
        });

        // Handle typing stop
        // socket.on("typing_stop", (conversationId, receiverId) => {
        //     if (!userId || !conversationId || !receiverId) return;

        //     if (typingUsers.has(userId)) {
        //         const userTyping = typingUsers.get(userId);
        //         userTyping[conversationId] = false;
        //         if (userTyping[`${conversationId}_timeout`]) {
        //             clearTimeout(userTyping[`${conversationId}_timeout`]);
        //             delete userTyping[`${conversationId}_timeout`];
        //         }
        //     }

        //     socket.to(receiverId).emit("user_typing", { userId, conversationId, isTyping: false });

        // })

        // Add a reaction  on message
        socket.on("add_reaction", async (messageId, emoji, reactionUserId) => {
            try {
                // Update the reaction in the database
                const message = await Message.findById(messageId);

                if (!message) return;

                const existingIndex = message.reactions.findIndex(
                    reaction => reaction.user.toString() === reactionUserId
                );
                if (existingIndex > -1) {
                    const existing = message.reactions[existingIndex]

                    if (existing.emoji === emoji) {
                        //rmove same reaction
                        message.reactions.splice(existingIndex, 1);
                    } else {
                        // change emoji 
                        message.reactions[existingIndex].emoji = emoji;
                    }
                } else {
                    // Add new reaction
                    message.reactions.push({ user: reactionUserId, emoji });
                }
                await message.save();

                const populateMessage = await Message.findOne(message?._id)
                    .populate("sender", "username profilePicture")
                    .populate("receiver", "username profilePicture")
                    .populate("reactions.user", "username");
                // Notify the sender about the updated reaction
                const reactionUpdated = {
                    messageId,
                    reaction: populateMessage.reactions,
                }

                const senderSocket = onlineUsers.get(populateMessage.sender?._id.toString());
                const receiverSocket = onlineUsers.get(populateMessage.receiver?._id.toString());

                if (senderSocket) io.to(senderSocket).emit("reaction_update", reactionUpdated);
                if (receiverSocket) io.to(receiverSocket).emit("reaction_update", reactionUpdated);

            } catch (error) {
                console.error("Error updating reaction:", error);
            }
        });

        // Handle Video Calls Events
        VideoCallEvent(socket, io);

        // Handle Disconnect and mark user Offline
        const handleDisconnected = async (sockets) => {
            if (!userId) return;
            try {
                onlineUsers.delete(userId);

                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId);
                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith("_timeout")) {
                            clearTimeout(userTyping[key]);
                        }
                    });
                    typingUsers.delete(userId);
                }
                await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });

                io.emit("user_status", { userId, isOnline: false, lastSeen: new Date() });
                socket.leave(userId); // Leave the user from their room
                console.log("User disconnected:", userId, sockets);
            } catch (error) {
                console.error("Error handling disconnection:", error);
            }
        };
        //Disconnect
        socket.on("disconnect", handleDisconnected);

        //Attach the Online UserMap for external use
        io.socketUserMap = onlineUsers;

        return io;
    });

};

export default initializeSocket;
