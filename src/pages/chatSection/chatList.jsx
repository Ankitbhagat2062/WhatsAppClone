import React from 'react'
import useLayoutStore from '../../store/layoutStore.js';
import useChatStore from '../../store/chatStore.js';
import useThemeStore from '../../store/themeStore.js';
import useUserStore from '../../store/useUserStore.js';
import formatTimestamp from '../../utils/formatTime.js';
import { FaPlus , FaSearch} from 'react-icons/fa';
import { getSocket } from '../../pages/services/chat.service.js';

const ChatList = ({contacts}) => {
    const setSelectedContact = useLayoutStore(state => state.setSelectedContact);
    const selectedContact = useLayoutStore(state => state.selectedContact);
    const {theme} = useThemeStore();
    const {user} = useUserStore();
    const {receiveMessage, fetchConversation} = useChatStore();
    const [searchTerm , setSearchTerm] = React.useState('');

    React.useEffect(() => {
        const socket = getSocket();
        if (socket) {
            socket.on("receive_message", (message) => {
                receiveMessage(message);
            });

            // Listen for conversation updates
            socket.on("conversation_updated", () => {
                // Refresh conversations to get updated data
                fetchConversation();
            });

            // Listen for message deletion events
            socket.on("message_deleted", () => {
                // Refresh conversations to get updated data
                fetchConversation();
            });
        }
        return () => {
            if (socket) {
                socket.off("receive_message");
                socket.off("conversation_updated");
                socket.off("message_deleted");
            }
        };
    }, [receiveMessage, fetchConversation]);
    const filteredContacts = contacts?.filter((contact) =>{
      return contact?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    })
  return (
    <div>
      <div className={`chat-list w-full border-r h-screen ${theme === 'dark' ? 'bg-[rgb(17,27,33)] border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 flex justify-between ${theme === 'dark' ? ' text-gray-100' : ' text-gray-900'}`}>
             <h2 className="text-xl font-semibold">Chats</h2>
             <button  className={`p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors`}>
              <FaPlus />
             </button>
          </div>
          <div className={`p-2`}>
            <div className='relative mb-4'>
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 
                ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                <input type="text" name="" id="" placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full py-2 pr-4 pl-10 border rounded-lg focus:outline-none focus:ring-green-500
                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-500' : 'bg-gray-100 text-black border-gray-200 placeholder-gray-400'}`} />
            </div>

          </div>
          <div className='overflow-y-auto h-[calc(100vh-120px)]'>
            {filteredContacts?.map((contact) => (
              <div key={contact?._id} 
              className={`p-3 flex items-center cursor-pointer
              ${theme === 'dark' 
                ? selectedContact?._id === contact?._id ? 'border-gray-700': ' hover:bg-gray-800'
                : selectedContact?._id === contact?._id ? 'border-gray-200': 'hover:bg-gray-100'}`}
              onClick={() => setSelectedContact(contact)}>
                <img src={contact?.profilePicture} alt={contact?.username} 
                className='w-12 h-12 rounded-full'/>
                <div className='flex-1 ml-4'>
                  <div className='flex justify-between items-baseline'>
                    <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      {contact.username}
                    </h2>
                    {contact?.conversation?.lastMessage[contact?.conversation?.lastMessage.length -1]?.createdAt && (
                      <span className={`text-xs 
                      ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatTimestamp(contact.conversation.lastMessage[contact?.conversation?.lastMessage.length -1].createdAt)}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-baseline justify-between mt-1`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                      {contact?.conversation?.lastMessage[contact?.conversation?.lastMessage.length -1]?.content || 'No messages yet'}
                      {/* {console.log(contact?.conversation || 'No messages yet')} */}
                    </p>
                    {contact?.conversation?.unread?.[0] > 0 && contact?.conversation?.lastMessage?.sender !== user?._id && (
                      <span className={`text-xs font-semibold flex items-center justify-center bg-green-500
                       text-white rounded-full h-5 w-5`}>
                        {contact.conversation.unread[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
  )
}

export default ChatList
