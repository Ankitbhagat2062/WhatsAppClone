import React from 'react';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import { logout } from '../services/user.service';
import { toast } from 'react-toastify';
import Layout from '../../Components/Layout';
import { FaComment, FaMoon, FaQuestionCircle, FaSearch, FaSignOutAlt, FaSun, FaUser, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Setting = () => {
  const [isThemeDialogueOpen, setIsThemeDialogueOpen] = React.useState(false)
  const { theme } = useThemeStore()
  const { user, clearUser } = useUserStore()

  const toggleThemeDialogueOpen = () => {
    setIsThemeDialogueOpen(!isThemeDialogueOpen)
  }

  const handleLogout = async () => {
    try {
      await logout()
      clearUser();
      toast.success("User Logout Successfully")
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <div>
      <Layout
        isThemeDialogOpen={isThemeDialogueOpen}
        toggleThemeDialog={toggleThemeDialogueOpen}>
        <div className={`h-screen ${theme === 'dark' ? 'bg-[rgb(17,27,33)] text-white' : ' bg-white text-black'}`}>
          <div className={`w-full border-r ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className='p-4'>
              <h1 className='text-xl font-semibold mb-4'>Settings</h1>
              <div className='relative mb-4'>
                <FaSearch className={`w-4 h-4 absolute top-2.5 left-3 text-gray-400`} />
                <input type="search" placeholder='Search Setting'
                  className={`w-full 
              ${theme === 'dark' ? 'bg-[#202c33] text-white' : 'bg-gray-100 text-black '} 
              border-none pl-10 placeholder-gray-400 rounded p-2`} name="" id="" />
              </div>
            </div>
            <div className={`flex items-center gap-4 p-3 ${theme === 'dark' ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'} rounded-lg cursor-pointer mb-4 `}>
              <img src={user.profilePicture} className='rounded-full w-14 h-14' alt="" />
              <div className='flex flex-col'>
                <span className='font-semibold'>{user?.username}</span>
                <p className='text-sm text-gray-400'>{user?.about}</p>
              </div>
            </div>
            <div className='h-[calc(100vh-240px)] overflow-y-auto'>
              <div className='space-y-1'>
                {
                  [
                    { Icon: FaUsers, label: "Account", href: "/user-profile" },
                    { Icon: FaComment, label: "Chats", href: "/" },
                    { Icon: FaQuestionCircle, label: "Help", href: "/help" }
                  ].map((item) => (
                    <Link to={item.href} key={item.label} className={`w-full flex items-center gap-3 p-2 rounded 
                    ${theme === 'dark' ? 'text-white hover:bg-[#202c33]' : "text-black hover:bg-gray-100"}`}>
                      <item.Icon className='h-5 w-5' />
                      <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : "bg-gray-200"} w-full p-4`}>
                        {item.label}
                      </div>
                    </Link>
                  ))
                }
                {/* theme Button  */}
                <button onClick={toggleThemeDialogueOpen} className={`w-full flex items-center gap-3 rounded p-2
                   ${theme === 'dark' ? 'text-white hover:bg-[#202c33]' : "text-black hover:bg-gray-100"}`}>
                  {theme === 'dark' ? (<FaMoon  className='h-5 w-5'/>) :( <FaSun className='h-5 w-5'/>)}
                  <div className={`flex flex-col text-start border-b
                    ${theme === 'dark' ? 'border-gray-700': "border-gray-200"} w-full`}>
                    Theme 
                    <span className='ml-auto text-sm text-gray-400'>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>
              <button onClick={handleLogout} className={`mt-10 md:mt-36 w-full flex items-center gap-3 p-4 rounded text-red-500 ${theme === 'dark'? 'text-white hover:bg-[#202c33]' : "text-black hover:bg-gray-100"}`}>
                  <FaSignOutAlt className='h-5 w-5'/> Log Out
              </button>

            </div>

          </div>
        </div>
      </Layout>
    </div>
  )
}

export default Setting
