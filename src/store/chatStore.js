import { create } from "zustand";
import { getSocket } from '../pages/services/chat.service.js'
import axiosInstance from "../pages/services/url.service.js";


const useChatStore = create((set, get) => ({
    currentUser: null,
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),

    // Socket Event Listeners
    initsocketListeners: () => {
        const socket = getSocket();
        if (!socket) return;

        // removing existing listeners to prevent duplicate handlers
        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send");
        socket.off("message_error");
        socket.off("message_deleted");
        socket.off("conversation_updated");

        /// Listen for incoming Messages
        socket.on("receive_message", (message) => {
            console.log("New message received:", message);
            get().receiveMessage(message);
        });

        // Confirm  Message Delivery
        socket.on("message_send", (message) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === message._id ? { ...msg, } : msg
                ),
            }));
            console.log("message_send:", message);
        });

        // Update Message Status
        socket.on("message_status_update", (messageId, messageStatus) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, messageStatus } : msg
                ),
            }));
            console.log("message_status:", messageId, messageStatus);
        });

        // Handle Reaction on message
        socket.on('reaction_update', (messageId, reactions) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                ),
            }));
            console.log("reaction_update:", messageId, reactions);
        });

        // Handle Deleting Messages
        socket.on("message_deleted", (messageId) => {
            console.log("Message deleted event received:", messageId);
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== messageId),
            }));
        });

        // Handle Conversation Updates
        socket.on("conversation_updated", (updatedConversation) => {
            set((state) => {
                const updatedConversations = state.conversations.data.map((conv) => 
                    conv._id === updatedConversation._id ? updatedConversation : conv
                );
                
                // If the current conversation was updated, refresh the messages
                if (state.currentConversation === updatedConversation._id) {
                    // This will trigger a re-fetch of messages in ChatWindow
                    get().fetchMessages(state.currentConversation);
                }
                
                return { conversations: { ...state.conversations, data: updatedConversations } };
            });
        });

        // Handle any Message error
        socket.on("message_error", (error) => {
            console.error("Message error:", error);
        });

        // Listeners for typing users
        socket.on("user_typing", (userId, conversationId, isTyping) => {
            set((state) => {
                const newTypingUsers = new Map(state.typingUsers);
                if (!newTypingUsers.has(conversationId)) {
                    newTypingUsers.set(conversationId, new Set());
                }
                const TypingSet = newTypingUsers.get(conversationId);
                if (isTyping) {
                    TypingSet.add(userId);
                } else {
                    TypingSet.delete(userId);
                }
                return { typingUsers: newTypingUsers };
            });
        });


        //Track Users Online and Offline status
        socket.on("user_status", (data) => {
            set((state) => {
                const newonlineUsers = new Map(state.onlineUsers);
                newonlineUsers.set(data.userId, { 
                    isOnline: data.isOnline, 
                    lastSeen: data.lastSeen 
                });
                return { onlineUsers: newonlineUsers };
            });
        });

        // Emit status check for all user for converstion list
        const { conversations } = get();
        if (conversations?.data?.length > 0) {
            conversations.data.forEach((conv) => {
                const otherUsers = conv?.participants?.find((p) => p._id !== get().currentUser?._id);
                if (otherUsers?._id) {
                    socket.emit("get_user_status", otherUsers._id, (status) => {
                        set((state) => {
                            const newOnlineUsers = new Map(state.onlineUsers);
                            newOnlineUsers.set(otherUsers._id, {
                                isOnline: status.isOnline,
                                lastSeen: status.lastSeen
                            });
                            return { onlineUsers: newOnlineUsers };
                        });
                        if (status) console.log()
                    });
                }
            });
        }
    },

    setCurrentUser: (user) =>
        set((state) => {
            if (state.currentUser?._id === user?._id) {
                return state; // no update if same user
            }
            return { currentUser: user };
        }),

    // setCurrentUser: user => set({ currentUser: user }),

    //cleanup
    cleanup: () => {
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            onlineUsers: new Map(),
            typingUsers: new Map()
        })
    },

    fetchConversation: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get(`/chats/conversations`);
            set({ conversations: data, loading: false });
            get().initsocketListeners()
            return data;
        } catch (error) {
            set({ error: error?.response?.data?.message, loading: false });
            return null;
        }
    },

    // Fetch Messages for a Conversation
    fetchMessages: async (conversationId) => {
        if (!conversationId) {
            set({ error: "Conversation ID is required", loading: false });
            return null;
        }
        set({ loading: true, error: null });
        try {
            const { data } = await axiosInstance.get(`/chats/conversations/${conversationId}/messages`);
            const messageArray = data.data || [];
            set({ messages: messageArray, currentConversation: conversationId, loading: false });

            // Mark unread Message as unread
            // const { markMessagesAsRead } = get();
            // markMessagesAsRead();

            return messageArray;
        } catch (error) {
            set({ error: error?.response?.data?.message, loading: false });
            return [];
        }
    },

    // Send a Message in realTime
    sendMessage: async (formData) => {
        const senderId = formData.get('senderId')
        const receiverId = formData.get('receiverId')
        const media = formData.get('media')
        const content = formData.get('content')
        const messageStatus = formData.get('messageStatus')

        const socket = getSocket();
        if (socket) console.log()
        const { conversations } = get();
        let conversationId = null;
        if ((conversations.data.length) > 0) {
            const conversation = conversations?.data?.find((conv) =>
                conv.participants.some((p) => p._id === senderId) &&
                conv.participants.some(p => p._id === receiverId)
            );
            if (conversation) {
                conversationId = conversation._id;
                set({ conversation: conversationId })
            }
        };

        // temp message befor actual response
        const tempId = `temmp_${Date.now()}`
        const optimisticMessage = {
            _id: tempId,
            sender: { _id: senderId },
            receiver: { _id: receiverId },
            conversation: conversationId,
            imageOrVideoUrl: media && media !== 'String' ? URL.createObjectURL(media) : null,
            content: content,
            contentType: media ? media.type.startsWith('image') ? 'image' : 'video' : 'text',
            createdAt: new Date().toISOString(),
            messageStatus
        };

        if (optimisticMessage) console.log()
        set((state) => ({
            messages: [...state.messages, optimisticMessage]
        }));
        try {
            const { data } = await axiosInstance.post(`/chats/send-message`, formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            const messageData = data.data || data;
            //Replace optimistic message with real one
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg?._id === tempId ? messageData : msg)
            }));
            
            // Emit socket event for real-time message delivery
            const socket = getSocket();
            if (socket) {
                socket.emit("send_message", messageData);
            }
            
            return messageData;
        } catch (error) {
            console.error(error?.response?.data?.message, error);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg?._id === tempId ? { messageStatus: 'Failed', ...msg } : msg),
                error: error?.response?.data?.message
            }));
            throw Error
        }
    },

    // Receive a Message in realTime
    receiveMessage: (message) => {
        if (!message) return;
        const { currentConversation, currentUser, messages } = get();

        const messageExist = messages.some((msg) => msg._id === message._id);
        if (messageExist) return;

        if (messages.conversation === currentConversation) {
            set((state) => ({
                messages: [...state.messages, message]
            }));
            //
            if (message.receiver?._id === currentUser?._id) {
                // Mark the message as read
                get().markMessagesAsRead();
            }
        }
        //Update Conversation Preview and unread Message Count
        set((state) => {
            const updatedConversations = state.conversations.data.map((conv) => {
                if (conv._id === message.conversation) {
                    return {
                        ...conv,
                        lastMessage: message,
                        unread: message?.receiver?._id === currentUser._id
                            ? [(conv.unread[0] || 0) + 1] : conv.unread
                    };
                }
                return conv;
            });
            return { conversations: { ...state.conversations, data: updatedConversations } };
        });
    },

    // Mark as Read 

    markMessagesAsRead: async () => {
        const { messages, currentUser, currentConversation } = get();
        if (messages.length === 0 || !currentUser) {
            // console.log("No messages or current user not set");
            return;
        }
        
        const unreadIds = messages.filter(msg => {
            const isUnread = msg.messageStatus !== 'read';
            const isReceiver = msg.receiver?._id === currentUser._id;
            console.log(`MessageId : ${msg?._id}`)
            console.log(`ReceiverId ${msg.receiver?._id}: status=${msg.messageStatus}, receiver=${msg.receiver?._id}, isUnread=${isUnread}, isReceiver=${isReceiver}`);
            return isUnread && isReceiver;
        }).map(msg => msg._id).filter(Boolean);

        // console.log("Unread message IDs:", unreadIds ,unreadIds.length ,messages);        
        if(unreadIds.length !== 0){
            try {
                let read = await axiosInstance.put(`/chats/messages/read`, { messageIds: unreadIds });
                console.log(read)
                // Update the messages in state with the new status
                set((state) => ({
                    messages: state.messages.map((msg) => 
                        unreadIds.includes(msg._id) ? { ...msg, messageStatus: 'read' } : msg
                    ),
                // Update conversation unread count to 0 when messages are marked as read
                conversations: {
                    ...state.conversations,
                    data: state.conversations.data.map(conv => {
                        if (conv._id === currentConversation) {
                            return {
                                ...conv,
                                unread: [0] // Set unread count to 0
                            };
                        }
                        return conv;
                    })
                }
                }));
                
                const socket = getSocket();
                if (socket) {
                    socket.emit("message_read", { messageIds: unreadIds, senderId: messages[0]?.sender?._id });
                }
            } catch (error) {
                console.error("Error marking messages as read:", error);
            }
        }
    },

    // Delete message
    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/chats/messages/${messageId}`);
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== messageId),
            }));
            return true;
        } catch (error) {
            console.error("Error deleting message:", error);
            set({ error: error?.response?.data?.message });
            return false;
        }
    },

    // Change or add reactions
    addReaction: async (messageId, emoji) => {
        const socket = getSocket();
        const { currentUser } = get();
        if (socket && currentUser) {
            socket.emit("add_reaction", messageId, emoji, currentUser?._id);
        }
        const formData = {messageId , emoji}
         try {
            const { data } = await axiosInstance.post(`/chats/add-reactions`, formData );
            const messageData = data.data || data;
            // Only update the reactions field, keep all other properties the same
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg?._id === messageId ? { ...msg, reactions: messageData.reactions } : msg)
            }));
            return messageData;
        } catch (error) {
            console.error(error?.response?.data?.message, error);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg?._id === messageId ? { messageStatus: 'Failed', ...msg } : msg),
                error: error?.response?.data?.message
            }));
            throw Error
        }
    },

    // Start Typing
    startTyping: (receiverId) => {
        const socket = getSocket();
        const { currentConversation } = get();
        if (socket && currentConversation && receiverId) {
            socket.emit("typing_start", { conversationId: currentConversation, receiverId });
        }
    },

    //Stop Typing
    stopTyping: (receiverId) => {
        const socket = getSocket();
        const { currentConversation } = get();
        if (socket && currentConversation && receiverId) {
            socket.emit("typing_stop", { conversationId: currentConversation, receiverId });
        }
    },

    //If user is typing
    isUserTyping: (userId) => {
        const socket = getSocket();
        if (socket) console.log()
        const { typingUsers, currentConversation } = get();
        if (!typingUsers.has(currentConversation) || !currentConversation || !userId) {
            return false;
        }
        return typingUsers.get(currentConversation).has(userId);
    },

    // if user is online
    isUserOnline: (userId) => {
        if (!userId) return null;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.isOnline || false;
    },
    // lastseen
    getUserLastSeen: (userId) => {
        if (!userId) return null;
        const { onlineUsers } = get();
        return onlineUsers.get(userId)?.lastSeen || null;
    },

}))


export default useChatStore;
