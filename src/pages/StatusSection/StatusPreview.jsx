import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmojiPicker from 'emoji-picker-react'
import { FaSmile, FaVolumeUp, FaPlay, FaPause, FaVolumeMute, FaPlus } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { IoIosMore } from "react-icons/io";
import { RiDeleteBin6Line } from "react-icons/ri";
import { GrFormView } from "react-icons/gr";

import formatTimestamp from '../../utils/formatTime';
import useStatusStore from '../../store/useStatusStore';
import useUserStore from '../../store/useUserStore';
import useOutsideclick from '../hooks/useOutsideclick';


const LoaderCard = () => {
  return (
    <>
      {/* Loader overlay */}
      <div
        role="status"
        className="absolute w-full h-full flex items-center justify-center bg-black/80 z-101 -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2"
      >
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 
               100.591C22.3858 100.591 0 78.2051 0 
               50.5908C0 22.9766 22.3858 0.59082 50 
               0.59082C77.6142 0.59082 100 22.9766 
               100 50.5908ZM9.08144 50.5908C9.08144 
               73.1895 27.4013 91.5094 50 91.5094C72.5987 
               91.5094 90.9186 73.1895 90.9186 
               50.5908C90.9186 27.9921 72.5987 9.67226 
               50 9.67226C27.4013 9.67226 9.08144 
               27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 
               38.4038 97.8624 35.9116 97.0079 
               33.5539C95.2932 28.8227 92.871 
               24.3692 89.8167 20.348C85.8452 
               15.1192 80.8826 10.7238 75.2124 
               7.41289C69.5422 4.10194 63.2754 
               1.94025 56.7698 1.05124C51.7666 
               0.367541 46.6976 0.446843 41.7345 
               1.27873C39.2613 1.69328 37.813 
               4.19778 38.4501 6.62326C39.0873 
               9.04874 41.5694 10.4717 44.0505 
               10.1071C47.8511 9.54855 51.7191 
               9.52689 55.5402 10.0491C60.8642 
               10.7766 65.9928 12.5457 70.6331 
               15.2552C75.2735 17.9648 79.3347 
               21.5619 82.5849 25.841C84.9175 
               28.9121 86.7997 32.2913 88.1811 
               35.8758C89.083 38.2158 91.5421 
               39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    </>
  );
};

const StatusProgressBar = ({ duration = 5000, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0); // time passed
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!paused) {
      startTimeRef.current = Date.now() - elapsedRef.current;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        elapsedRef.current = elapsed;

        const percentage = Math.min((elapsed / duration) * 100, 100);
        setProgress(percentage);

        if (percentage === 100) {
          clearInterval(intervalRef.current);
          if (onComplete) onComplete();
        }
      }, 50);
    }

    return () => clearInterval(intervalRef.current);
  }, [paused, duration, onComplete]);

  // Toggle pause/resume
  const handleToggle = () => setPaused((prev) => !prev);

  return (
    <div className="absolute top-0 left-0 w-full">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-600/40 rounded">
        <div
          className="h-1 bg-green-500 rounded transition-all duration-100 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Play / Pause Button */}
      <button
        onClick={handleToggle}
        className="absolute right-4 top-3 bg-black/40 text-white rounded-full p-2 flex items-center justify-center"
      >
        {paused ? <FaPlay size={14} /> : <FaPause size={14} />}
      </button>
    </div>
  );
};

const CustomToastContent = () => {
  return (
    <div className=" p-3 rounded-md text-gray-300 text-sm">
      <strong>ChatSphere Status </strong>
      <p className="mt-1">
        You have created ChatSphere Status Successfully
      </p>
    </div>
  )
}

const VideoStatus = ({ src }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    setShowControls(true);
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-black"
      onClick={handleVideoClick}
    >
      {/* Progress Loader (top bar) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-600/40">
        <div
          className="h-1 bg-green-500 transition-all duration-100 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="max-h-[70vh] rounded-lg"
        playsInline
        muted={isMuted}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <LoaderCard />
      )}

      {/* Controls */}
      {showControls && !isLoading && (
        <div className="absolute top-5 left-0 inset-x-0 flex items-center justify-center space-x-3 text-white">
          {/* Mute/Unmute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="bg-black/50 p-3 rounded-full hover:bg-black/70"
          >
            {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
          </button>

          {/* Play / Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="bg-black/50 p-3 rounded-full hover:bg-black/70"
          >
            {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
          </button>

          {/* More */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="bg-black/50 p-3 rounded-full hover:bg-black/70"
          >
            <IoIosMore size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

const StatusPreview = ({ status, file, showStatus, setShowStatus }) => {

  const UserName = ({ status }) => {
    const [showDeleteStatus, setShowDeleteStatus] = useState(false)
    const handleDeleteStatus = async (statusId) => {
      try {
        await deleteStatus(statusId)
        setShowDeleteStatus(false);
        setShowStatus(false);
        toast.success('Successfully Deleted the Status');
      } catch (error) {
        console.error("Error Deleting Status", error.message)
      }
    }
    const { user } = useUserStore();
    return (
      <div className="p-1 bg-transparent text-white flex items-center w-full mb-4">
        <img alt={status?.user?.username || user?.username} className="h-10 w-10 rounded-full" src={status?.user?.profilePicture || user?.profilePicture} />
        <div className="flex-grow ml-3">
          <h2 className="font-semibold text-start text-gray-400"> {status?.user?.username || user?.username}</h2>
          <div className="text-sm text-gray-400">{status.createdAt ? formatTimestamp(status?.createdAt) : 'New Status Added'}</div>
        </div>
        <div className="absolute top-0 right-0">
          {/* More */}
          <button onClick={() => setShowDeleteStatus((prev) => !prev)}
            className="bg-black/50 p-3 rounded-full hover:bg-black/70 cursor-pointer"
          >
            <IoIosMore size={20} />
          </button>

          {showDeleteStatus && (
            <div className='absolute top-8 right-1 z-50 rounded-xlpy-2 text-sm
           bg-[#1d1f1f] text-white flex items-center justify-center w-40'>
              <button className={`flex items-center font-extrabold w-full px-4 py-2 gap-3 rounded-lg text-red-800`}
                onClick={() => handleDeleteStatus(status?._id)}>
                <RiDeleteBin6Line />  Delete Status
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  const [caption, setCaption] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStatusPrivacy, setShowStatusPrivacy] = useState(false);
  const [statusFiles, setStatusFiles] = useState([])
  const emojiPickerRef = useRef(null);

  const { user } = useUserStore();
  const { createStatus, deleteStatus, loading } = useStatusStore();

  const onEmojiClick = (emojiObject) => {
    setCaption((prev) => prev + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  const handleSave = async () => {
    if (loading) return;
    let Files;
    try {
      file ? Files = file : Files = status.content
      const updated = await createStatus({ file: Files, content: caption });
      setShowStatus(false);
      console.log(updated);

      toast(<CustomToastContent />, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to Update Status");
    }
  };

  useOutsideclick(emojiPickerRef, () => {
    setShowEmojiPicker(false)
  })

  const [current, setCurrent] = useState(0);

  // Auto slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % statusFiles.length);
    }, 3000);

    return () => clearInterval(interval); // cleanup on unmount
  }, [statusFiles.length]);

  useEffect(() => {
    if (file) {
      setStatusFiles((prev) => {
        // avoid duplicates if same file is already in list
        const exists = prev.some(f => f === file);
        return exists ? prev : [...prev, file];
      });
    }
    else if (Array.isArray(status?.contents)) {
      // filter only image/video
      const mediaFiles = status.contents.filter(
        (file) => file.contentType === "image" || file.contentType === "video"
      );

      setStatusFiles((prev) => {
        // avoid duplicates
        const newFiles = mediaFiles.filter(
          (file) => !prev.some((f) => f.content === file.content)
        );

        return [...prev, ...newFiles];
      });
    }

  }, [file, status.content]);

  useEffect(() => {
    return () => {
      statusFiles.forEach(f => {
        if (f instanceof File) {
          URL.revokeObjectURL(f);
        }
      });
    };
  }, [statusFiles]);

  const handleAddFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      // const fileUrl = URL.createObjectURL(file); // create local preview
      setStatusFiles((prev) => [...prev, file]); // add new file into images
    }
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % statusFiles.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + statusFiles.length) % statusFiles.length);
  };
  return (
    <>
      {loading && (<LoaderCard />)}
      <div className={`${showStatus ? '' : "hidden"} flex flex-col gap-4 fixed inset-0 w-full justify-center items-center z-100 bg-black/90`}>
        
        <div className="flex flex-col items-center justify-center bg-white shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-lg max-h-full overflow-hidden landscape:w-[500px] portrait:w-full">
          {/* Emoji Picker */}
          <div className="relative w-full">
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute z-50 mt-2"
                style={{ maxWidth: "300px" }}
              >
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>

          {/* Main Preview Box */}
          <div className="relative w-full portrait:w-full text-black rounded-lg shadow-lg">
            {status && <UserName status={status} className={`mt-4`} />}

            {/* Carousel */}
            <div className="relative h-100 overflow-hidden rounded-lg md:h-96">
              {statusFiles.map((src, index) => {
                const isFile = src instanceof File;
                const url = isFile ? URL.createObjectURL(src) : src.content;
                const type = isFile ? src.type : src?.contentType;
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === current ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    {type?.startsWith("image") && (
                      <>
                        {status &&
                          <StatusProgressBar
                            duration={5000}
                            onComplete={() => setShowStatus(false)}
                          />
                        }
                        <img
                          src={url}
                          alt={`Slide ${index + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </>
                    )}
                    {type?.startsWith("video") && (
                      <VideoStatus src={url} className="h-full w-full object-contain" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Carousel Controls */}
            <button
              type="button"
              onClick={prevSlide}
              className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 text-white px-3 py-2 rounded-full"
            >
              ❮
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/30 text-white px-3 py-2 rounded-full"
            >
              ❯
            </button>

            {/* Dots */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {statusFiles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-3 h-3 rounded-full ${index === current ? "bg-green-400" : "bg-gray-400"
                    }`}
                />
              ))}
            </div>
            {/* Caption Input */}
            <div className={`pt-4 flex flex-col w-full bg-gray-800/50 text-white resize-none focus:outline-none`} >
              {status?.contents
                .filter((file) => file.contentType === "text")
                .map((file, index) => (
                  <div key={index} className='flex justify-center items-center px-4 text-gray-800'>
                    <span>{file.content}</span>
                  </div>
                ))}
                {status?.viewers && (
                  <div className=' flex justify-center items-center'>
                    <GrFormView className='w-5 h-5 rounded-full' />
                    {status.viewers.length -1}
                  </div>
                )}
              {(status?.user?._id !== user?._id) &&
                <div className={`flex w-full p-2 resize-none focus:outline-none`} >
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="text-white mx-2 "
                  >
                    <FaSmile />
                  </button>
                  <input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption"
                    className="focus:outline-none px-4 flex justify-center items-center bg-gray-700 rounded-full w-full h-8 hover:bg-gray-600 "
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSave();
                      }
                    }}
                  />
                  <button onClick={() => handleSave()} className="ml-2">
                    <IoSend />
                  </button>
                </div>
              }
            </div>
          </div>

        </div>

        <div className="flex flex-col items-center justify-between w-full p-2 bg-[#161717] rounded-md">
          <div className="line-down bg-gray-800 h-1 w-full"></div>
          {file && (
            <div className="flex items-center justify-between w-full p-2 rounded-md">

              {/* Display status content preview */}

              {/* Status (Contacts) button */}
              <button
                onClick={() => setShowStatusPrivacy(true)}
                className="text-white bg-[#1D1F1F] px-3 py-1 rounded-md hover:bg-[#161717]"
              >
                Status (Contacts)
              </button>
              <div className="flex gap-4 flex-wrap">
                {/* Render all previews */}
                {statusFiles.map((src, index) => {
                  const isFile = src instanceof File;
                  const url = isFile ? URL.createObjectURL(src) : src;
                  const type = isFile ? src.type : status?.contentType;

                  return (
                    <div
                      key={index}
                      className={`transition-opacity duration-700 ease-in-out h-12 w-12 border-2 rounded-md overflow-hidden flex items-center justify-center
        ${index === current ? "border-green-400" : "border-gray-400"}`}
                    >
                      {type?.startsWith("image") && (
                        <img src={url} alt={`preview-${index}`} className="h-full w-full object-cover" />
                      )}
                      {type?.startsWith("video") && (
                        <video src={url} className="h-full w-full object-cover" />
                      )}
                    </div>
                  );
                })}
                {/* Plus icon button to open file input */}
                <label htmlFor="fileInput" className="h-12 w-12 border-2 border-gray-400 rounded-sm flex justify-center items-center cursor-pointer text-white p-2 hover:bg-gray-600">
                  <FaPlus />
                </label>
                {/* Hidden file input */}
                <input id="fileInput" type="file" accept="image/*,video/*" className="hidden"
                  onChange={handleAddFile} />
              </div>
              {/* Send button */}
              <button
                onClick={handleSave}
                className="text-white bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700 flex items-center"
              >
                <IoSend size={20} />
                <span className="ml-1">Send</span>
              </button>

            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default StatusPreview
