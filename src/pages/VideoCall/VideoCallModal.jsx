import { useEffect, useRef, useState } from "react";
import useUserStore from "../../store/useUserStore.js";
import useVideoCallStore from "../../store/videoCallStore.js";
import useThemeStore from "../../store/themeStore.js";
import { MdClose } from "react-icons/md";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { MdOutlineCallEnd } from "react-icons/md";
import { toast } from "react-toastify";


const VideoCallModal = ({ socket }) => {
    const { initMedia, initiateCall, acceptCall, callEnded, setCallEnded, startCall, setStartCall, isVideoEnabled, toggleVideo, isAudioEnabled, toggleAudio, endCall, isCallModalOpen, setCallModalOpen, callStatus, setCallStatus, incomingCall, setIncomingCall, remoteId, setRemoteId, setOnlineUsers, onlineUserToCall, } = useVideoCallStore();

    const myVideoRef = useRef();
    const remoteVideoRef = useRef();
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const [myId, setMyId] = useState(null);

    const { user } = useUserStore();
    const { theme } = useThemeStore();
    // 🔹 Initialize media stream and listeners
    useEffect(() => {
        if (isCallModalOpen) {
            // Only request media when modal is open
            initMedia(myVideoRef, localStreamRef, pcRef);
        } else {
            // Stop camera/mic when modal closes
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }

            if (myVideoRef.current) {
                myVideoRef.current.srcObject = null;
            }
        }
    }, [isCallModalOpen]);


    // 🔹 Initialize socket listeners
    useEffect(() => {

        if (user?._id) {
            socket.emit("register-user", user._id);
        }

        socket.on("active-users", (users) => {
            setOnlineUsers(users);
        });


        socket.on("me", (id) => setMyId(id));

        // Caller sends an offer → show incoming call popup
        socket.on("offer", ({ from, sdp, caller }) => {
            setIncomingCall({ from, sdp, caller });
        });

        // Caller receives an answer
        socket.on("answer", async ({ sdp }) => {
            if (!pcRef.current) return;
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on("remote-toggle-video", ({ enabled }) => {
            if (remoteVideoRef.current) {
                if (!enabled) {
                    // Hide video but keep audio playing
                    remoteVideoRef.current.srcObject?.getVideoTracks().forEach(track => {
                        track.enabled = false;
                    });
                    remoteVideoRef.current.style.display = "none"; // hide video element
                } else {
                    remoteVideoRef.current.srcObject?.getVideoTracks().forEach(track => {
                        track.enabled = true;
                    });
                    remoteVideoRef.current.style.display = "block"; // show video element
                }
            }
        });

        socket.on("remote-toggle-audio", ({ enabled }) => {
            if (remoteVideoRef.current) {
                // We can't "mute" the remote's mic directly (WebRTC doesn't allow that),
                // but we can mute/unmute the entire <video> element's audio.
                remoteVideoRef.current.muted = !enabled;
            }
        });


        // Both sides exchange ICE candidates
        socket.on("ice-candidate", async ({ candidate }) => {
            try {
                await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error(err);
            }
        });

        socket.on("call-ended", () => {
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            setRemoteId("");
            setCallEnded(true);
            setCallModalOpen(false);
            setIncomingCall(null);
            // Optionally, reset your remote video ref
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            toast("The call has ended.");
        });

        socket.on("call-status", ({ status }) => {
            setCallStatus(status);
            if (status === "failed") {
                toast("Call failed. The other user disconnected.");
                setIncomingCall(null);
                setRemoteId("");
                setCallEnded(true);
                setCallModalOpen(false);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            }
        });

        return () => {
            socket.off("active-users");
            socket.off("me");
            socket.off("offer");
            socket.off("answer");
            socket.off("remote-toggle-video");
            socket.off("remote-toggle-audio");
            socket.off("ice-candidate");
            socket.off("call-ended");
            socket.off("call-status");
        };
    }, []);


    const createPeerConnection = (otherUserId) => {

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // Add local stream tracks
        localStreamRef.current?.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Send ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && otherUserId) {
                socket.emit("ice-candidate", {
                    to: otherUserId,
                    candidate: event.candidate,
                });
            }
        };

        return pc;
    };

    // 🔹 Accept an incoming call
    const handleAcceptCall = async () => {
        acceptCall(pcRef, createPeerConnection, myVideoRef, localStreamRef);
    };


    // 🔹 Toggle Video Function
    const handleToggleVideo = () => {
        toggleVideo(localStreamRef.current);
    };

    const handleToggleAudio = () => {
        toggleAudio(localStreamRef.current);
    };

    const handleVideoCall = async (remoteId) => {
        if (remoteId) {
            setTimeout(() => {
                initiateCall(remoteId, createPeerConnection, pcRef, myVideoRef, localStreamRef, user);
            }, 1000);
        } else {
            toast("Please enter a remote ID.");
        }
    };

    useEffect(() => {
        if (startCall && remoteId) {
            handleVideoCall(remoteId);
            setStartCall(false);
        }
    }, [startCall, remoteId]);

    const handleRejectCall = () => {
        setCallEnded(true);
        endCall(pcRef.current, remoteVideoRef.current);
    };

    useEffect(() => {
        let timeoutId;

        if (callStatus === "calling") {
            timeoutId = setTimeout(() => {
                handleRejectCall();
                setCallModalOpen(false);
                toast("Call timed out. No answer.");
            }, 30 * 1000);
        }

        if (callStatus === "connected") {
            clearTimeout(timeoutId);
        }

        return () => clearTimeout(timeoutId);
    }, [callStatus]);

    return (
        <div className={`${isCallModalOpen ? "flex" : "hidden"} fixed inset-0 z-50 items-center justify-center bg-[#000000b0]`}>
            <div className={`relative w-full h-full max-h-3xl max-w-4xl rounded-lg overflow-hidden flex items-center 
                    ${callStatus === 'connected' ? 'justify-end' : 'justify-center'} flex-col
                ${theme === 'dark' ? 'bg-[#191a1a]' : 'bg-[#ECE5DD]'}`}>
                <div className="w-full h-full top-0 left-0 absolute bg-repeat" style={{ opacity: 0.06 }} data-chat-bg />

                <div className={`h-32 w-32 rounded-full mb-4 mx-auto overflow-hidden ${callStatus === 'connected' ? 'hidden' : ''}`}>
                    <img src={incomingCall?.caller?.profilePicture || onlineUserToCall?.profilePicture}
                        alt={incomingCall?.caller?.username || onlineUserToCall?.username} className='w-full h-full object-cover' />
                </div>
                <h2 className={`text-2xl font-semibold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-gray-200'}`}>
                    {incomingCall?.caller?.username || onlineUserToCall?.username}
                </h2>
                <div className={`border border-white z-1 
                    ${callStatus === 'connected' ? 'absolute top-4 right-4' : 'flex items-center justify-center'} 
                    w-48 h-36 rounded-lg overflow-hidden`}>
                    <video className="w-full h-full object-cover" ref={myVideoRef} autoPlay playsInline muted width="300" />
                </div>
                <p className={`text-lg  ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} z-1`}>
                    {callStatus && (callStatus.charAt(0).toUpperCase() + callStatus.slice(1).toLowerCase())}...
                </p>
                <div className={`flex justify-center items-center z-1 gap-3 py-2 mb-4`}>
                    {callStatus === 'ringing' && (
                        <button
                            className="relative z-10 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full 
                            flex items-center justify-center text-white animate-bounce-custom"
                            onClick={handleAcceptCall}>
                            <FaVideo className="w-6 h-6" />
                            {/* Ripple Pulse */}
                            <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping-custom"></span>
                        </button>
                    )}

                    <button className='w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors z-1'
                        onClick={handleRejectCall}><MdOutlineCallEnd className='w-6 h-6 ' /></button>
                    {callStatus === 'connected' && (
                        <div className="flex z-1 gap-3">
                            <button className={` w-12 h-12
                                             ${isVideoEnabled ? "bg-gray-500" : "bg-white"} 
                                             rounded-full flex items-center justify-center text-white transition-colors`}
                                onClick={handleToggleVideo} title={isVideoEnabled ? "Turn off video" : "Turn on video"}>
                                {isVideoEnabled ?
                                    <FaVideo className={`h-5 w-5 text-white`} /> : <FaVideoSlash className={`h-5 w-5 text-black`} />}
                            </button>
                            <button className={` w-12 h-12
                                            ${isAudioEnabled ? "bg-gray-500" : "bg-white"} 
                                            rounded-full flex items-center justify-center text-white transition-colors`}
                                onClick={handleToggleAudio} title={isAudioEnabled ? "Turn off audio" : "Turn on audio"}>
                                {isAudioEnabled ?
                                    <FaMicrophone className={`h-5 w-5 text-white`} /> : <FaMicrophoneSlash className={`h-5 w-5 text-black`} />}
                            </button>
                        </div>
                    )}

                </div>
                {(!callEnded) && (
                    <div className="absolute top-0 w-full h-full overflow-hidden  pointer-events-none">
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                )}
                <button className='absolute top-1 right-1 w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors z-1'
                    onClick={handleRejectCall}><MdClose className='w-6 h-6 ' /></button>
            </div>
        </div>
    );
}

export default VideoCallModal;
