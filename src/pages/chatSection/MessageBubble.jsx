import React, { useRef, useState } from 'react'
import { quickReactions } from '../../utils/formatTime.js'
// import formatTime from '../../utils/formatTime.js'
import { FaCheck, FaCheckDouble, FaSmile, FaPlus, FaRegCopy } from 'react-icons/fa'
import { HiDotsVertical } from "react-icons/hi";
import useOutsideclick from '../hooks/useOutsideclick.js';
import EmojiPicker from 'emoji-picker-react';
import { RxCross2 } from 'react-icons/rx'
import { RiDeleteBin6Line } from "react-icons/ri";

const MessageBubble = ({ message, theme, currentUser, onReact, deleteMessage }) => {
  // console.log("MessageBubble props. This is my message:", message);
  const [showReactions, setShowReactions] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const messageRef = useRef(null)
  const [showOptions, setShowOptions] = useState(false)
  const optionsRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const reactionsMenuRef = useRef(null);

  const isUserMessage = message.sender?._id === currentUser?._id
  const bubbleClass = isUserMessage ? 'chat-end' : 'chat-start'

  const bubbleContentClass = isUserMessage ? `chat-bubble md:max-w-[100%] min-w-[130px] ${theme === 'dark' ? 'bg-[#144d38] text-white' : 'bg-[#d9fdd3] text-black'}` :
    `chat-bubble md-max-w-[50%] min-w-[130px]  ${theme === 'dark' ? 'bg-[#144d38] text-white' : 'bg-[#d9fdd3] text-black'}`

  const handleReact = (emoji) => {
    onReact(message._id, emoji)
    setShowEmojiPicker(false)
    setShowReactions(false)

  }
  if (message === 0) return;


  if (!message) {
    return <div>No message data</div>;
  }
  const formatTime = (date) => {
    const Created = new Date(date);
    const options = { hour: '2-digit', minute: '2-digit' };
    return Created.toLocaleTimeString([], options);
  }
  useOutsideclick(emojiPickerRef, () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false)
    }
  })
  useOutsideclick(reactionsMenuRef, () => {
    if (showReactions) setShowReactions(false)
  })
  useOutsideclick(optionsRef, () => {
    if (showOptions) setShowOptions(false)
  })
  // if(message.sender?._id === currentUser?._id){  console.log('Message is :',message.content ,'The current User is :',currentUser)}
  // if(isUserMessage){  console.log('File is :',message.imageOrVideoUrl)}

  return (
    <div className={`chat ${bubbleClass}`}>
      <div className={`${bubbleContentClass} max-w-xs px-4 py-2 rounded-lg relative group`} ref={messageRef}>
        <div className='flex justify-center gap -2'>
          {message.contentType === 'text' && (<p className="text-sm mr-2">{message.content}</p>)}
          {message.contentType === 'image' && (
            <div className="text-sm mt-2">
              <img src={message.imageOrVideoUrl} alt="Image/Video" className='max-w-xs rounded-lg w-50 h-50' />
              {message.contentType == 'text' && (<p className="text-sm mt-1">{message.content}</p>)}
            </div>
          )}
          {message.contentType === 'video' && (
            <div className="text-sm mt-2">
              <video src={message.imageOrVideoUrl} alt="Image/Video" controls className='max-w-xs w-full rounded-lg' />
              {message.contentType == 'text' && (<p className="text-sm mt-1">{message.content}</p>)}
            </div>
          )}

        </div>
        <div className="self-end flex justify-end gap-1 text-xs opacity-60 mt-2 ml-2">
          <span>
            {formatTime(new Date(message.createdAt), "HH:mm")}
          </span>
          {isUserMessage && (
            <>
              {message.messageStatus === 'send' && <FaCheck size={12} />}
              {message.messageStatus === 'delivered' && <FaCheckDouble size={12} />}
              {message.messageStatus === 'read' && <FaCheckDouble size={12} className='text-blue-900' />}
            </>
          )}
        </div>
        <div className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
          <HiDotsVertical size={18} onClick={() => setShowOptions(prev => !prev)}
            className={`p-1 rounded-field ${theme === 'dark' ? 'text-white' : 'text-black'}`} />

        </div>
        <div className={`${isUserMessage ? '-left-10' : '-right-10'} top-1/2 absolute transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
          <button onClick={() => setShowReactions(true)}
            className={`p-1 rounded-full h-10 w-10 flex items-center justify-center
        ${theme === 'dark' ? 'bg-[#282c33] hover:bg-[#282c33]/80' : 'bg-white hover:bg-gray-100'} shadow-lg`}>
            <FaSmile className={`${theme === 'dark ' ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
        {showReactions && (
          <div ref={reactionsMenuRef}
            className={`absolute -top-8 ${isUserMessage ? 'right-40' : 'left-0'} 
          transform translate-x-1/2 flex items-center hover:bg-[#282c33]/90 rounded-full px-2 py-1.5 gap-1 shadow-lg z-50 `}>
            {quickReactions.map((emoji, index) => (
              <button type="button"
                key={index} onClick={() => handleReact(emoji)}
                className={`hover:scale-125 transition transform p-1`}>
                {emoji}
              </button>
            ))}
            <div className='flex items-center mx-1'>
              <div className='w-[1px] h-5 bg-gray-600 mx-1'></div>
              <button className='hover:bg-[#ffffff1a] rounded-full p-1'
                onClick={() => setShowEmojiPicker(true)}>
                <FaPlus className={`h-4 w-4 text-gray-400`} />
              </button>
            </div>
          </div>
        )}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className='absolute left-0 mb-6 z-50'>
            <div className='relative'>
              <EmojiPicker onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                theme={theme} />
              <button onClick={() => setShowEmojiPicker(false)}
                className='absolute top-2 right-2 text-gray-500 hover:text-gray-700'>
                <RxCross2 />
              </button>
            </div>
          </div>
        )}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`absolute -bottom-5 ${isUserMessage ? 'right-2' : 'left-2'} ${theme === 'dark' ? 'bg-[#2a3942]' : 'bg-gray-200'} rounded-full px-2 shadow-lg`}>
            {message.reactions.map((reaction, index) => (
              <span key={index} className='mr-1'>{reaction.emoji}</span>
            ))}
          </div>
        )}
        {showOptions && (
          <div className={`absolute top-8 right-1 z-50 w-36 rounded-xlpy-2 text-sm
           ${theme === 'dark' ? 'bg-[#1d1f1f] text-white' : 'bg-gray-100 text-black'}`}>
            <button onClick={() => {
              if (message.contentType === 'text') {
                navigator.clipboard.writeText(message.content)
              }
              setShowOptions(false)
            }}
              className='flex items-center w-full px-4 py-2 gap-3 rounded-lg'>
              <FaRegCopy size={14} />
              <span>Copy</span>
            </button>

            {isUserMessage && (
              <button onClick={() => {
                deleteMessage(message?._id)
                setShowOptions(false)
              }}
                className='flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-800'>
                <RiDeleteBin6Line className={`text-red-600`} size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble
