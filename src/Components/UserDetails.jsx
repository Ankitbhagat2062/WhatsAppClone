import React, { useState, useEffect } from 'react'
import useUserStore from '../store/useUserStore'
import useThemeStore from '../store/themeStore';
import { updateUserProfile } from '../pages/services/user.service';
import { toast } from 'react-toastify';
import Layout from './Layout';
import { motion } from 'framer-motion';
import { FaCamera, FaCheck, FaPencilAlt, FaSmile } from 'react-icons/fa';
import { MdCancel } from 'react-icons/md';
import EmojiPicker from 'emoji-picker-react';
console.log(motion)
const UserDetails = () => {
  const [name, setName] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setshowAboutEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (user) {
      setName(user.username || "")
      setAbout(user.about || "")
    }
  }, [user])

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file))
    }
  }
  const handleSave = async (field) => {
    try {
      setLoading(true)
      const formData = new FormData();
      if (field === 'name') {
        formData.append('username', name)
        setIsEditingName(false)
        setShowNameEmoji(false)
      }
      else if (field === 'about') {
        formData.append('about', about)
        setIsEditingAbout(false);
        setshowAboutEmoji(false);
      }

      if (profilePicture && field === 'profile') {
        formData.append('media', profilePicture)
      }
      
      // Log form data contents for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const updated = await updateUserProfile(formData);
      setUser(updated.data);
      setPreview(null);
      setProfilePicture(null);
      toast.success('Profile Updated')
      console.log('Update response:', updated)
    } catch (error) {
      console.error('Profile update error:', error)
      console.error('Error response:', error.response?.data)
      toast.error('Failed to Update Profile')
    }
    finally{
      setLoading(false)
    }
  }

  const handleEmojiSelect = (emoji, field) => {
    if (field === 'name') {
      setName((prev) => prev + emoji.emoji)
      setShowNameEmoji(false)
    } else {
      setAbout((prev) => prev + emoji.emoji);
      setshowAboutEmoji(false);
    }
  }

  return (
    <Layout >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`h-screen border-r 
        ${theme === 'dark' ? 'bg-[rgb(17,27,33)] border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-black'}`}>
        <div className={`w-full rounded-lg p-6`}>
          <div className='flex items-center mb-6'>
            <h1 className='text-2xl font-bold'>Profile</h1>
          </div>
          <div className='space-y-6'>
            <div className='flex flex-col items-center'>
              <div className='relative groupt'>
                <img src={preview || user.profilePicture} alt="Profile Picture"
                  className='w-52 h-52 rounded-full mb-2 object-cover' />
                <label htmlFor="profileUpload"
                  className='absolute inset-0 bg-[#000000b0]  flex items-center rounded-field opacity-0 justify-center group-hover:opacity-100 transition-opacity cursor-pointer'>
                  <div className='text-white text-center '>
                    <FaCamera className='h-8 w-8 mx-auto mb-2' />
                    <span className='text-sm'> Change</span>
                  </div>
                  <input type="file" id='profileUpload' accept='image/*' onChange={handleImageChange} className='hidden' />
                </label>
              </div>
            </div>
            {preview && (
              <div className='flex justify-center gap-4 mt-4'>
                <button onClick={() => handleSave("profile")} 
                className='bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white'>
                  {loading ? "Saving":"Change"}
                  </button>
                <button onClick={() => {
                  setPreview(null)
                  setProfilePicture(null)
                }} 
                className='bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded text-white'>Discard</button>
              </div>
            )}
            <div className={`relative p-4 ${theme === 'dark'? 'bg-gray-800':'bg-white'} shadow-sm rounded-lg`}>
              <label htmlFor="name" className='block text-sm font-medium mb-1 text-center text-gray-500'>Your Name</label>
              <div className='flex items-center'>
                {isEditingName ?(
                  <input type="text" id='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded:md focus:outline-none focus:ring-2 focus:ring-green-500 
                    ${theme === 'dark'? 'bg-gray-700 text-white':'text-black bg-white'}`}/>
                ):(
                  <span className='w-full px-3 py-2'>{user?.username || name}</span>
                )}

                {isEditingName ?(
                  <>
                  <button onClick={() =>handleSave("name")}
                  className='ml-2 focus:outline-none'>
                    <FaCheck className='h-5 w-5 text-green-500' />
                  </button>
                  <button onClick={() =>setShowNameEmoji(!showNameEmoji)}
                  className='ml-2 focus:outline-none'>
                    <FaSmile className='h-5 w-5 text-yellow-500' />
                  </button>
                  <button onClick={() =>{
                    setIsEditingName(false)
                    setShowNameEmoji(false)
                  }}
                  className='ml-2 focus:outline-none'>
                    <MdCancel className='h-5 w-5 text-gray-500' />
                  </button>
                  </>
                ):(
                  <button onClick={() =>setIsEditingName(!isEditingName)}
                  className='ml-2 focus:outline-none'>
                    <FaPencilAlt className='h-5 w-5 text-gray-500' />
                  </button>
                )}
              </div>
              {showNameEmoji && (
                <div className='absolute z-10 -top-80'>
                  <EmojiPicker onEmojiClick={(emoji) =>handleEmojiSelect(emoji,"name")}/>
                </div>
              )}
            </div>


            <div className={`relative p-4 ${theme === 'dark'? 'bg-gray-800':'bg-white'} shadow-sm rounded-lg`}>
              <label htmlFor="name" className='block text-sm font-medium mb-1 text-center text-gray-500'>About</label>
              <div className='flex items-center'>
                {isEditingAbout ?(
                  <input type="text" id='about'
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className={`w-full px-3 py-2 border rounded:md focus:outline-none focus:ring-2 focus:ring-green-500 
                    ${theme === 'dark'? 'bg-gray-700 text-white':'text-black bg-white'}`}/>
                ):(
                  <span className='w-full px-3 py-2'>{user?.about || about}</span>
                )}

                {isEditingAbout ?(
                  <>
                  <button onClick={() =>handleSave("about")}
                  className='ml-2 focus:outline-none'>
                    <FaCheck className='h-5 w-5 text-green-500' />
                  </button>
                  <button onClick={() =>setshowAboutEmoji(!showAboutEmoji)}
                  className='ml-2 focus:outline-none'>
                    <FaSmile className='h-5 w-5 text-yellow-500' />
                  </button>
                  <button onClick={() =>{
                    setIsEditingAbout(false)
                    setshowAboutEmoji(false)
                  }}
                  className='ml-2 focus:outline-none'>
                    <MdCancel className='h-5 w-5 text-gray-500' />
                  </button>
                  </>
                ):(
                  <button onClick={() =>setIsEditingAbout(!isEditingAbout)}
                  className='ml-2 focus:outline-none'>
                    <FaPencilAlt className='h-5 w-5 text-gray-500' />
                  </button>
                )}
              </div>
              {showAboutEmoji && (
                <div className='absolute z-10 -top-80'>
                  <EmojiPicker onEmojiClick={(emoji) =>handleEmojiSelect(emoji,"about")}/>
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </Layout>
  )
}

export default UserDetails