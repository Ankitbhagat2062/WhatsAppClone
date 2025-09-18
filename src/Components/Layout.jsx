import React , {useRef} from 'react';
import useLayoutStore from '../store/layoutStore';
import { useLocation } from 'react-router-dom';
import ThemeBox from '../pages/Theme/ThemeBox.jsx';
import useThemeStore from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Phone, Mail } from 'lucide-react';

import Sidebar from './Sidebar';
import ChatWindow from '../pages/chatSection/ChatWindow.jsx';

const EmptyState = () => {
  const { theme } = useThemeStore();

  return (
    <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
      <div className="mb-6">
        <MessageSquare className={`w-16 h-16 mb-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`} />
      </div>
      <h3 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
        Welcome to ChatSphere
      </h3>
      <p className={`text-lg mb-6 max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
        Select a chat to start messaging or create a new conversation
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className={`flex items-center px-4 py-2 rounded-md transition-colors ${theme === 'dark'
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-green-500 hover:bg-green-600 text-white'
          }`}>
          <Users className="w-4 h-4 mr-2" />
          New Group
        </button>
        <button className={`flex items-center px-4 py-2 rounded-md transition-colors ${theme === 'dark'
          ? 'bg-gray-700 hover:bg-gray-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}>
          <Phone className="w-4 h-4 mr-2" />
          New Chat
        </button>
      </div>
    </div>
  );
};

const Layout = ({ children, isThemeDialogOpen, toggleThemeDialog, isStatusPreviewOpen, statusPreviewContent }) => {
  const selectedContact = useLayoutStore(state => state.selectedContact);
  const setSelectedContact = useLayoutStore(state => state.setSelectedContact);
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Log when Sidebar is rendered for mobile
  React.useEffect(() => {
    if (isMobile) {
      console.log('Sidebar Rendered for mobile view');
    }
  }, [isMobile]);

  return (
    <>
      <ThemeBox className={`z-1 ${(theme === 'light') ? 'bg-[#111b21] text-white' : 'bg-gray-100 text-black'}`} />
      <div className={`min-h-screen ${(theme === 'dark') ? 'bg-[#111b21] text-white' : 'bg-gray-100 text-black'}
    flex relative`}>
        {!isMobile && <Sidebar />}
        <div className={`flex-1 flex overflow-hidden ${isMobile ? 'p-4 flex-col' : ''}`}>
          <div className="flex h-screen w-full overflow-hidden">
            <AnimatePresence initial={false} mode="sync">
              {(!selectedContact || !isMobile) && (
                <motion.div
                  key="chatlist"
                  initial={{ opacity: 0, x: isMobile ? "-100%" : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "-100%" }}
                  transition={{ type: "tween" }}
                  className={`h-full flex flex-col md:w-1/4 w-full ${isMobile ? "pb-1" : ""
                    }`}
                >
                  {children}
                </motion.div>
              )}

              {(selectedContact || !isMobile) && (
                <motion.div
                  key="chatWindow"
                  initial={{ opacity: 0, x: isMobile ? "100%" : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{ type: "tween" }}
                  className={`h-full flex flex-col md:w-3/4 w-full ${isMobile ? "pb-16" : ""
                    }`}
                >
                  <ChatWindow
                    selectedContact={selectedContact}
                    setSelectedContact={setSelectedContact}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
        {isMobile && (
          <div>
            <Sidebar />
          </div>
        )}
        {isThemeDialogOpen && (
          <div className='fixed inset-0 flex items-center justify-center bg-[#000000b0] z-50'>
            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-[#202c33] text-white' : 'bg-white text-black'}
          shadow-lg max-w-sm w-full`}>
              <h2 className='text-2xl font-semibold mb-4'>Select Theme</h2>
              <div className='flex space-x-2 mb-4'>
                <label htmlFor="light-theme" className={`cursor-pointer flex items-center px-4 py-2 rounded-md 
          ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'}`}>
                  <input type="radio"
                    name="theme" id="light-theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                    className='from-radio text-blue-600' />
                  <span className="material-icons">Light</span>
                </label>
                <label htmlFor="dark-theme" className={`cursor-pointer flex items-center px-4 py-2 rounded-md 
          ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-800 text-white'}`}>
                  <input type="radio"
                    name="theme" id="dark-theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                    className='from-radio text-blue-600' />
                  <span className="material-icons">Dark</span>
                </label>
              </div>
              <button onClick={toggleThemeDialog}
                className='mt-6 w-full bg-blue-500 text-white hover:bg-blue-600 transition duration-200 py-2 rounded'>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Status Preview */}
        {isStatusPreviewOpen && (
          <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50'>
            {statusPreviewContent}
          </div>
        )}
      </div>
    </>
  );

}

export default Layout;
