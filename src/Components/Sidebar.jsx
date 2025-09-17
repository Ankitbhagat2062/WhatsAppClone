import React from 'react'
import useThemeStore from '../store/themeStore';
import { useLocation, Link } from 'react-router-dom';
import useUserStore from '../store/useUserStore';
import useLayoutStore from '../store/layoutStore';
import { FaWhatsapp, FaUser, FaCog } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md";
import { motion } from 'framer-motion';

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();


  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    let newTab;
    switch (location.pathname) {
      case '/': newTab = 'chats'; break;
      case '/user-profile': newTab = 'profile'; break;
      case '/status': newTab = 'status'; break;
      case '/setting': newTab = 'setting'; break;
      default: newTab = null;
    }

    // Only update if different
    if (newTab && newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname, activeTab, setActiveTab]);

  //   React.useEffect(() => {
  //   if (location.pathname === '/') {
  //     setActiveTab('chats');
  //   } else if (location.pathname === '/user-profile') {
  //     setActiveTab('profile');
  //   } else if (location.pathname === '/status') {
  //     setActiveTab('status');
  //   } else if (location.pathname === '/setting') {
  //     setActiveTab('setting');
  //   }
  // }, [location, setActiveTab]);

  if (isMobile && selectedContact) {
    return null; // Hide sidebar on mobile if a contact is selected
  }

  const sidebarContent = (
    <>
      {/* Chats */}
      <Link
        to="/"
        className={`${isMobile ? '' : 'mb-8'} ${activeTab === 'chats' ? 'bg-gray-300 shadow-sm p-2 rounded-full' : ''
          } focus:outline-none`}
      >
        <FaWhatsapp
          className={`sidebar-icon h-6 w-6 
            ${activeTab === 'chats'
              ? theme === 'dark'
                ? 'text-gray-800'
                : ''
              : theme === 'dark'
                ? 'text-gray-300'
                : 'text-gray-800'
            }`}
        />
      </Link>

      {/* Status */}
      <Link to="/status" className={`${isMobile ? '' : 'mb-8'}`}>
        <MdRadioButtonChecked
          className={`sidebar-icon h-6 w-6 
            ${activeTab === 'status'
              ? theme === 'dark'
                ? 'text-gray-300'
                : ''
              : theme === 'dark'
                ? 'text-gray-300'
                : 'text-gray-800'
            }`}
        />
      </Link>

      {/* Spacer for mobile */}
      {!isMobile && <div className="flex-grow" />}

      {/* Profile */}
      {user?.profilePicture ? (
        <Link to="/user-profile" className={`${isMobile ? '' : 'mb-8'}`}>
          <img src={user?.profilePicture} alt="Profile" className={`${isMobile ? '' : 'mb-8'} h-8 w-8 rounded-full`} />
        </Link>
      ) : (
        <Link to="/user-profile" className={`${isMobile ? '' : 'mb-8'}`}>
          <FaUser
            className={`sidebar-icon h-6 w-6 
            ${activeTab === 'profile'
                ? theme === 'dark'
                  ? 'text-gray-800'
                  : ''
                : theme === 'dark'
                  ? 'text-gray-300'
                  : 'text-gray-800'
              }`}
          />
        </Link>
      )}

      {/* Settings */}
      <Link to="/setting" className={`${isMobile ? '' : 'mb-8'}`}>
        <FaCog
          className={`sidebar-icon h-6 w-6 
            ${activeTab === 'setting'
              ? theme === 'dark'
                ? 'text-gray-300'
                : ''
              : theme === 'dark'
                ? 'text-gray-300'
                : 'text-gray-800'
            }`}
        />
      </Link>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`${isMobile ? 'fixed bottom-0 left-0 right-0 h-16' : 'w-16 h-screen border-r-2'}
        ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-[rgb(239,242,254)] border-gray-300'}
        bg-opacity-90 flex items-center py-4 shadow-lg
        ${isMobile ? 'flex-row justify-around' : 'flex-col justify-between'}`}
    >
      {sidebarContent}
    </motion.div>
  );
};

export default Sidebar;
