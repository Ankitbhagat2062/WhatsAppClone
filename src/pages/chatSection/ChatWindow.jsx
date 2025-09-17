import React, { useEffect, useRef, useState } from 'react'
import useThemeStore from '../../store/themeStore.js'
import useUserStore from '../../store/useUserStore.js'
import useVideoCallStore from '../../store/videoCallStore.js'
import useChatStore from '../../store/chatStore.js'
import { isToday, isYesterday, format } from 'date-fns'
import whatsAppImage from '../../utils/images/whatsapp_image.png'
import MessageBubble from './MessageBubble.jsx'
import { FaLock, FaArrowLeft, FaVideo, FaEllipsisV, FaTimes, FaSmile, FaPaperclip, FaImage, FaFile, FaFileAlt, FaPaperPlane } from 'react-icons/fa'
import EmojiPicker from 'emoji-picker-react';
// import VideoCallManager from '../VideoCall/VideoCallManager.jsx'
import { getSocket } from '../services/chat.service.js'
// import useVideoCallStore from '../../store/videoCallStore.js'
import VideoCallModal from '../VideoCall/VideoCallModal.jsx'
import { toast } from 'react-toastify'

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = React.useState("");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [selectedReactions, setSelectedReactions] = React.useState(null);
  const typingTimeoutRef = React.useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const { isCallModalOpen, setCallModalOpen , startCall ,setStartCall, callStatus, remoteId, setRemoteId, onlineUsers, setOnlineUsers, setOnlineUserToCall } = useVideoCallStore();
  const socket = getSocket()

  useEffect(() => {
    if (callStatus === "ringing") {
      setCallModalOpen(true);
    }
  }, [callStatus])

  useEffect(() => {
    if (user?._id) {
      socket.emit("register-user", user._id);
    }

    socket.on("active-users", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.off("active-users");
    }

  }, [])

  // inside Component B
  useEffect(() => {
    if (!selectedContact?._id || onlineUsers.length === 0) return;

    const contactOnlineUser = onlineUsers.find(
      (u) => u._id === selectedContact._id
    );

    if (contactOnlineUser) {
      setOnlineUserToCall(contactOnlineUser);
      // 🔥 auto start the call
      setRemoteId(contactOnlineUser.socketId);
    } else {
      setOnlineUserToCall(selectedContact);
    }
  }, [selectedContact?._id, onlineUsers]);
 

  const handleVideoCall = () => {
    if (selectedContact && isUserOnline  && remoteId) { 
      setTimeout(() => {   
        setCallModalOpen(true);
      }, 1000);// 👈 mark that the user explicitly started call
      setStartCall(true); // tell modal: user initiated call
    } else {
      toast("User is Offline. Cannot initiate the call.");
      setCallModalOpen(false);
    }

  };

  const { messages,
    // loading,
    sendMessage,
    receiveMessage,
    fetchMessages,
    fetchConversation,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    // cleanup,
    deleteMessage,
    addReaction,
    markMessagesAsRead
  } = useChatStore();

  // get online status and lastSeen
  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);


  React.useEffect(() => {
    // Handle side effects here
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find(conv =>
        conv.participants?.some(participant => participant._id === selectedContact?._id));
      if (conversation?._id) {
        fetchMessages(conversation._id);
      }
    }
  }, [selectedContact, conversations, fetchMessages]);

  const hasMarkedAsReadRef = useRef(false);

  // Call markMessagesAsRead only once when chat window opens with unread messages
  useEffect(() => {
    if (messages.length > 0 && selectedContact && !hasMarkedAsReadRef.current) {
      const conversation = conversations?.data?.find(conv =>
        conv.participants?.some(participant => participant._id === selectedContact?._id));
      if (conversation && conversation.unread[0] > 0) {
        markMessagesAsRead();
        hasMarkedAsReadRef.current = true;
        // console.log('Mark Messages as Read', markMessagesAsRead)
      }
    }
  }, [messages, selectedContact, markMessagesAsRead, conversations, receiveMessage]);

  // Reset the ref when selectedContact changes
  useEffect(() => {
    hasMarkedAsReadRef.current = false;
  }, [selectedContact]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages && selectedContact) {
      startTyping(selectedContact?._id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedContact?._id);
    }, 3000);

    // Cleanup function to clear the timeout
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messages, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    setFilePreview(null);
    try {
      const formData = new FormData();
      formData.append('senderId', user?._id);
      formData.append('receiverId', selectedContact?._id);

      const status = online ? "delivered" : "send"
      formData.append('messageStatus', status)
      if (message.trim()) {
        formData.append('content', message.trim())
      }
      // If there is a file nclude that 
      if (selectedFile) {
        formData.append('media', selectedFile, selectedFile.name)
      }

      await sendMessage(formData)

      // Clear State
      setMessage("")
      setFilePreview(null)
      setSelectedFile(null)
      setShowFileMenu(false)
      console.log(formData)
    } catch (error) {
      console.error('send messaging error ', error)
    }
  }

  // Date separator function - can be used when implementing message grouping
  const renderDateSeperator = (date) => {
    if (!isValidate(date)) {
      return null
    }
    let dateString;
    if (isToday(date)) {
      dateString = 'Today'
    } else if (isYesterday(date)) {
      dateString = 'Yesterday'
    } else {
      dateString = format(date, 'EEEE MMMM d')
    }

    return (
      <div className={`flex justify-center my-4`}>
        <span className={`px-4 py-2 rounded-full text-sm 
                  ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'}`}>
          {dateString}
        </span>
      </div>
    )
  }


  // Group Messages 
  const groupMessage = Array.isArray(messages) ? messages.reduce((acc, message) => {
    if (!message.createdAt) return acc
    const date = new Date(message.createdAt)
    if (isValidate(date)) {
      const dateString = format(date, "yyyy-MM-dd")
      if (!acc[dateString]) {
        acc[dateString] = []
      }
      acc[dateString].push(message)
    } else {
      console.error('Invalid date for message', message)
    }
    return acc;
  }, {}) : {}

  const handleReaction = (messageId, emoji) => {

    console.log(messageId, emoji)
    addReaction(messageId, emoji)
    setSelectedReactions(messageId, emoji)
    console.log(selectedReactions)
  }

  if (!selectedContact) {
    return <div className={`flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center`}>
      <div className='max-w-md'>
        <img src={whatsAppImage} alt="" className='w-full h-auto' />
        <h2 className={`text-3xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Select a Conversation to start Chatting
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
          Choose a contact from list on the left to begin messaging
        </p>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-8 text-sm flex items-center justify-center gap-2`}>
          <FaLock className={`h-4 w-4`} />
          Your Personal Message are end to end encrypted
        </p>
      </div>
    </div>
  }

  return (
    <>
      <div className='flex-1 flex-col flex min-h-screen w-full relative'>
        <div className={`p-4 ${theme === 'dark' ? ' bg-[#303430] text-white' : ' bg-[rgb(239,242,245)] text-gray-600'} flex items-center`}>
          <button className={`mr-2 focus:outline-none `}
            onClick={() => setSelectedContact(null)}>
            <FaArrowLeft className={`h-6 w-6`} />
          </button>

          <img src={selectedContact?.profilePicture} alt={selectedContact?.username}
            className='h-10 w-10 rounded-full' />

          <div className={`flex-grow ml-3`}>
            <h2 className={`font-semibold text-start`}>
              {selectedContact?.username}
            </h2>
            {isTyping ? (
              <div>Typing...</div>
            ) : (
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {online ? 'Online' : lastSeen ? `LastSeen ${format(lastSeen, 'HH:mm')} ` : 'Offline'}
              </div>
            )}
          </div>
          <div className='flex items-center space-x-4'>
            <button className='focus:outline-none' onClick={() => handleVideoCall()} title={online ? "Starting Video Call " : "User is Offline"}>
              <FaVideo className='h-5 w-5 text-green-500 hover:text-green-600' />
            </button>
            <button className='focus:outline-none'>
              <FaEllipsisV className='h-5 w-5' />
            </button>
          </div>

        </div>

        <div className={`relative flex-1 p-4 overflow-auto flex-col ${theme === 'dark' ? 'bg-[#191a1a]' : ' bg-[rgb(241.236,229)]'}`}>
          {/* Background layer */}

          {/* Messages layer */}
          <div className="relative z-10">
            <div className="w-full h-full top-0 left-0 absolute bg-repeat" style={{ opacity: 0.06 }} data-chat-bg />

            {Object.entries(groupMessage).map(([date, messages]) => {
              const filteredMessages = messages.filter(msg => {
                // Check if message conversation is an array and contains the selected conversation ID
                const messageConversationId = Array.isArray(msg.conversation) ? msg.conversation[0] : msg.conversation;
                const selectedConversationId = selectedContact?.conversation?._id;
                const matches = messageConversationId === selectedConversationId;
                // console.log("Message", msg._id, "conversation match:", matches, "msg.conversation:", msg.conversation, "selected conversation ID:", selectedConversationId);
                return matches;
              });
              // console.log("Filtered messages for date", date, ":", filteredMessages);

              // Only render if there are filtered messages for this date
              if (filteredMessages.length === 0) {
                return null;
              }

              return (
                <React.Fragment key={date}>
                  {renderDateSeperator(new Date(date))}
                  {filteredMessages.map(msg => {
                    // console.log("Rendering MessageBubble with msg:", msg,);
                    return (
                      <MessageBubble key={msg._id}
                        message={msg}
                        theme={theme}
                        currentUser={user}
                        onReact={handleReaction}
                        deleteMessage={deleteMessage} />
                    );
                  })}
                </React.Fragment>
              );
            })}
            <div ref={messageEndRef} />
          </div>


        </div>
        {filePreview && (
          <div className='relative p-2'>
            {selectedFile?.type.startsWith("video") ? (
              <video src={filePreview} alt={filePreview} controls
                className='w-80  object-cover rounded shadow-lg mx-auto'></video>
            ) : (
              <img src={filePreview} alt={filePreview} className='w-80  object-cover rounded shadow-lg mx-auto' srcSet="" />
            )}
            <button onClick={() => { setFilePreview(null), setSelectedFile(null) }}
              className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full'>
              <FaTimes className='h-4 w-4' />
            </button>
          </div>
        )}
        <div className={`p-4 ${theme === 'dark' ? 'bg-[#303430]' : 'bg-white'} flex items-center gap-1`}>
          <button className='focus:outline-none'
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <FaSmile className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className='absolute left-0 bottom-16 z-50'>
              <EmojiPicker onEmojiClick={(emojiObject) => {
                setMessage(prev => prev + emojiObject.emoji)
                setShowEmojiPicker(false)
              }}
                theme={theme} />

            </div>
          )}
          <div className='relative'>
            <button className='focus:outline-none' onClick={() => setShowFileMenu(!showFileMenu)}>
              <FaPaperclip className={`h-6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-2`} />
            </button>
            {showFileMenu && (
              <div className={`p-1 absolute bottom-full left-0 mb-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg`}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange}
                  accept='image/*,video/*,video/3gpp,.3gpp,.mp4,.mov,.avi,.wmv,.mkv' className='hidden' name="" id="" />
                <button
                  onClick={triggerFileInput}
                  className={`flex items-center px-4 w-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-500' : 'hover:bg-gray-100'}`}>
                  <FaImage className={`mr-2`} />Image/Video
                </button>
                <button
                  onClick={triggerFileInput}
                  className={`flex items-center px-4 w-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-500' : 'hover:bg-gray-100'}`}>
                  <FaFileAlt className={`mr-2`} />Documents
                </button>
              </div>
            )}
          </div>

          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage()

              }
            }}
            placeholder='Type a Message'
            className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500
          ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
          />
          <button onClick={handleSendMessage}
            className='focus:outline-none'>
            <FaPaperPlane className='h-6 w-6 text-green-500' />
          </button>
        </div>
      </div>
      {/* Always mount VideoCallModal, hide it with CSS */}
      <VideoCallModal
        socket={socket}
        className={isCallModalOpen ? "block" : "hidden"}
      />
    </>
  );
};

export default ChatWindow;
