import React, { useState, useRef, useEffect } from 'react'
import useThemeStore from '../../store/themeStore'
import useUserStore from '../../store/useUserStore';
import useStatusStore from '../../store/useStatusStore';
import useOutsideclick from '../hooks/useOutsideclick';
import StatusPreview from './StatusPreview';
import formatTimestamp from '../../utils/formatTime';
import Layout from '../../Components/Layout';

import { motion } from 'framer-motion';
import { FaCamera, FaPencilAlt, FaPlus, FaArrowLeft } from 'react-icons/fa';
import { ImCross } from "react-icons/im";
import { RxCross2 } from "react-icons/rx";
import { CiCirclePlus } from "react-icons/ci";
import { FaEllipsisVertical } from "react-icons/fa6";


const Status = () => {
  const [file, setShowFile] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const [status, setStatus] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);
  const optionsRef = useRef(null);
  const [previewType, setPreviewType] = useState(null);
  const [rawFile, setRawFile] = useState(null);      // actual File
  const [previewUrl, setPreviewUrl] = useState(null); // preview URL

  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const { statuses, error, fetchStatuses, inittializeSocket, cleanupSocket, clearError, loading, viewStatus } = useStatusStore();

  useEffect(() => {
    fetchStatuses();
    inittializeSocket();
    return () => {
      cleanupSocket()
    }
  }, [user?._id]);

  useEffect(() => {
    return () => clearError();
  }, [])

  useOutsideclick(optionsRef, () => {
    setShowOptions(false)
  })

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setRawFile(file); // keep the real File for upload
    setPreviewUrl(URL.createObjectURL(file)); // keep a URL for preview
    if (file) {
      setShowFile(URL.createObjectURL(file));
      if (file.type.startsWith('video/')) {
        setPreviewType('video');
      } else if (file.type.startsWith('image/')) {
        setPreviewType('image');
      } else {
        setPreviewType(null);
      }
      setShowOptions(false);
      setShowStatus(true);
    }
  }

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  }

  const handlePhotosVideosClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleTextClick = () => {
    alert('Open CreateStatus popup');
    setShowOptions(false);
  }

  const clearPreview = () => {
    setShowFile(null);
    setPreviewType(null);
    setShowStatus(false)
  }

  const handlePreviewStatus = async (status) => {
    if (status?.contents) {
      try {
        await viewStatus(status?._id)
        setShowStatus(true)
        setStatus(status)
      } catch (error) {
        console.error("Error Viewing Status", error)
      }
    } else  {
      setShowOptions(true);
    }
  }

  // Sort statuses by createdAt descending
  const sortedStatuses = [...statuses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Get latest status per user
  const latestStatusesByUser = sortedStatuses.filter(
    (status, index, self) =>
      index === self.findIndex(s => s.user._id === status.user._id)
  );

  // Split into "My Status" and "Today's Status"
  const myStatus = latestStatusesByUser.filter(s => s.user._id === user?._id);
  const todaysStatus = latestStatusesByUser.filter(s => s.user._id !== user?._id);
  const StatusItem = ({ status }) => (
    <div className='flex gap-1'>
      <div className="relative" onClick={() => handlePreviewStatus(status)}>
        {Array.isArray(status?.contents) &&
          status.contents.map((file, index) => (
            <div key={index}>
              {file.contentType === "video" ? (
                <video
                  src={file.content}
                  autoPlay
                  muted
                  loop
                  className="w-14 h-14 rounded-full border-2 border-green-500 object-cover"
                />
              ) : file.contentType === "image" ? (
                <img
                  src={file.content}
                  alt="status"
                  className="w-14 h-14 rounded-full border-2 border-green-500 object-cover"
                />
              ) : null}
            </div>
          ))}

        {!(Array.isArray(status?.contents)) && (
          <img
            src={status?.contents?.content || user?.profilePicture}
            alt="file"
            className='w-14 h-14 rounded-full border-2 border-green-500'
          />
        )}
        <button
          className="plus-btn absolute bottom-0 right-0 bg-green-500 rounded-full p-1 text-white shadow-md"
          onClick={e => { e.stopPropagation(); toggleOptions(); }}
        >
          <FaPlus size={14} />
        </button>
      </div>

      <div>
        <p className="font-medium">{status?.user?.username || 'My Status'}</p>
        <p className="text-sm text-gray-400">
          {status.createdAt ? formatTimestamp(status.createdAt) : 'Click To Add Status Update'}
        </p>
      </div>
    </div>
  );
  return (
    <Layout >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`h-screen px-4 border-r ${theme === 'dark' ? 'bg-[rgb(17,27,33)] border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-black'}`}>
        <div className='flex justify-between my-4'>
          <div
            className={`flex justify-between items-center shadow-md ${theme === "dark" ? "bg-[rgb(17,27,33)]" : "bg-white"
              }`}
          >
            <h2 className="text-2xl font-bold">Status</h2>
          </div>
          <div className="flex">
            <div className="flex items-center cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              toggleOptions();
            }}>
              <CiCirclePlus className='w-6 h-6 rounded-full' />
            </div>
            <div className="flex items-center cursor-pointer">
              <FaEllipsisVertical className='w-6 h-6 rounded-full' />
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4 mt-2 flex justify-between">
            <span className="block sm:inline">The Error is {error}</span>
            <button className="float-right text-red-500 hover:text-red-700">
              <RxCross2 className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={`w-full rounded-lg flex relative gap-1 flex-col`}>
          <div className={`w-full rounded-lg flex relative gap-1 flex-col`}>
            {loading && <p>Loading...</p>}

            {/* My Status */}
            {myStatus.length > 0 ? (
              <div className='flex flex-col gap-1'>
                <h1 className='mb-4 text-gray-400'>My Status</h1>
                {myStatus.map(status => (
                  <StatusItem key={status._id} status={status} />
                ))}
              </div>
            ) : (
              <div className='flex flex-col gap-1'>
                <h1 className='mb-4 text-gray-400'>My Status</h1>
                <StatusItem key={user?._id} status={user} />
              </div>
            )}

            {/* Today's Status */}
            {todaysStatus.length > 0 && (
              <div className='flex flex-col gap-1 mt-4'>
                <h1 className='mb-4 text-gray-400'>Today's Status</h1>
                {todaysStatus.map(status => (
                  <StatusItem key={status._id} status={status} />
                ))}
              </div>
            )}
          </div>


          {showOptions && (
            <div ref={optionsRef} className={`absolute top-10 z-10 mt-2 w-48 rounded-md shadow-lg
          ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} border border-gray-300 dark:border-gray-700`}>
              <div
                onClick={handlePhotosVideosClick}
                className='flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700'>
                <FaCamera />
                <span className={`text-gray-400`}>Photos & videos</span>
              </div>
              <div
                onClick={handleTextClick}
                className='flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700'>
                <FaPencilAlt />
                <span className={`text-gray-400`}>Text</span>
              </div>
            </div>
          )}

          <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

        </div>
        {(showStatus) && (
          <div className='mt-4 w-full'>
            <button className="mr-2 focus:outline-none fixed top-1 left-1 rounded-full p-1 z-101 " onClick={clearPreview}>
              <FaArrowLeft className={`text-white `} size={20} />
            </button>
            <StatusPreview
              showStatus={showStatus}
              setShowStatus={setShowStatus}
              previewType={previewType}
              file={rawFile}
              previewUrl={previewUrl}
              status={status}
            />
            <button
              onClick={clearPreview}
              className='fixed top-1 right-1 rounded-full p-1  z-101'>
              <ImCross className='text-white 'size={20} />
            </button>
          </div>
        )}
      </motion.div >
    </Layout >

  )
}

export default Status