import React from 'react'
import { motion } from 'framer-motion';
import Layout from './Layout.jsx';
import ChatList from '../pages/chatSection/chatList.jsx';
import { getAllUsers } from '../pages/services/user.service.js';

const HomePage = () => {
  const [allUsers, setAllUsers] = React.useState([]);
  const fetchAllUsers = async () => {
    try {
      const response = await getAllUsers();
      if(response.status === 'success') {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  React.useEffect(() => {
    fetchAllUsers()
  }, [])
  return (
    <div>
      <Layout>
        <motion.div
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          exit={{ opacity: 0 }}
        >
          <ChatList contacts={allUsers}/>
        </motion.div>
      </Layout>
    </div>
  )
}

export default HomePage
   
