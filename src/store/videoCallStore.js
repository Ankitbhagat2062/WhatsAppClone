import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware'
import { getSocket } from '../pages/services/chat.service';
const useVideoCallStore = create(
    subscribeWithSelector((set, get) => (
        {
            currentCall: null,
            socket: getSocket(),
            incomingCall: null,
            onlineUsers: [],
            onlineUserToCall: null,
            callType: null, // Video or Audio
            startCall: false,   // 👈 NEW FLAG
            callEnded: false,   // 👈 NEW FLAG

            // media State 
            remoteId: null,
            isVideoEnabled: true,
            isAudioEnabled: true,
            isCallModalOpen: false,
            callStatus: "idle",//idle calling ringing , connecting , connected . ended


            // Actions

            setStartCall: (val) => set({ startCall: val }), // 👈 setter
            setCurrentCall: (call) => {
                set({ currentCall: call })
            },
            setIncomingCall: (call) => {
                set({ incomingCall: call })
            },
            setCallType: (type) => {
                set({ callType: type })
            },
            setRemoteId: (id) => {
                set({ remoteId: id })
            },
            setCallModalOpen: (open) => {
                set({ isCallModalOpen: open })
            },
            setCallStatus: (status) => {
                set({ callStatus: status })
            },
            setOnlineUsers: (users) => {
                set({ onlineUsers: users || [] })
            },
            setOnlineUserToCall: (user) => {
                set({ onlineUserToCall: user })
            },
            setCallEnded: (ended) => {
                set({ callEnded: ended })
            },
            initMedia: async (myVideoRef, localStreamRef , pcRef) => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    localStreamRef.current = stream;
                    if (myVideoRef.current) {
                        myVideoRef.current.srcObject = stream;
                    }

                    if (pcRef.current) {
                        const senders = pcRef.current.getSenders();

                        stream.getTracks().forEach(track => {
                            const sender = senders.find(s => s.track && s.track.kind === track.kind);
                            if (sender) {
                                sender.replaceTrack(track);
                            } else {
                                pcRef.current.addTrack(track, stream);
                            }
                        });
                    }
                } catch (err) {
                    console.error("❌ Error accessing media devices:", err);
                }
            },
            initiateCall: async (remoteId, createPeerConnection, pcRef, myVideoRef, localStreamRef, user) => {
                const { socket, setRemoteId, setCallModalOpen, setCallEnded } = get();
                if (!remoteId) return;

                setRemoteId(remoteId);
                setCallModalOpen(true);
                setCallEnded(false);

                // ✅ Ensure local media
                if (!localStreamRef.current) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        localStreamRef.current = stream;
                        if (myVideoRef.current) {
                            myVideoRef.current.srcObject = stream;
                        }
                    } catch (err) {
                        console.error("❌ Error accessing media devices:", err);
                        return;
                    }
                }

                // ✅ Create PeerConnection
                const pc = createPeerConnection(remoteId);
                pcRef.current = pc;

                // ✅ Create and send offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit("offer", {
                    to: remoteId,
                    sdp: offer,
                    fromUserId: user?._id,
                });
            },
            acceptCall: async (pcRef, createPeerConnection, myVideoRef, localStreamRef) => {
                const { socket, incomingCall, setIncomingCall, setRemoteId, setCallModalOpen, setCallEnded } = get();
                if (!incomingCall) return;

                setRemoteId(incomingCall.from);
                setCallModalOpen(true);
                setCallEnded(false);

                // ✅ Ensure local media
                if (!localStreamRef.current) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                        localStreamRef.current = stream;
                        if (myVideoRef.current) {
                            myVideoRef.current.srcObject = stream;
                        }
                    } catch (err) {
                        console.error("❌ Error accessing media devices:", err);
                        return;
                    }
                }

                // ✅ Create PeerConnection
                const pc = createPeerConnection(incomingCall.from);
                pcRef.current = pc;

                // ✅ Set caller's offer
                await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.sdp));

                // ✅ Create & send answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit("answer", { to: incomingCall.from, sdp: answer });

                setIncomingCall(null);
            },
            toggleVideo: (localStreamRef) => {
                const { remoteId, socket } = get();
                if (!localStreamRef) return;

                const videoTrack = localStreamRef.getTracks().find((track) => track.kind === "video");

                if (videoTrack) {
                    videoTrack.enabled = !videoTrack.enabled;
                    set({ isVideoEnabled: videoTrack.enabled });

                    // Notify remote peer
                    if (remoteId) {
                        socket.emit("toggle-video", { to: remoteId, enabled: videoTrack.enabled });
                    }
                }
            },
            toggleAudio: (localStreamRef) => {
                const { remoteId, socket } = get();
                if (!localStreamRef) return;

                const audioTrack = localStreamRef.getTracks().find((track) => track.kind === "audio");

                if (audioTrack) {
                    audioTrack.enabled = !audioTrack.enabled;
                    set({ isAudioEnabled: audioTrack.enabled });

                    // Notify remote peer
                    if (remoteId) {
                        socket.emit("toggle-audio", { to: remoteId, enabled: audioTrack.enabled });
                    }
                }
            },
            endCall: (pcRef, remoteVideoRef) => {
                const { remoteId, socket } = get();
                if (pcRef) {
                    pcRef.close(); // Properly close RTCPeerConnection
                    pcRef = null;
                }

                // Notify remote user
                if (remoteId) {
                    socket.emit("hang-up", { to: remoteId });
                }

                set({ callEnded: true });
                set({ remoteId: null, isCallModalOpen: false, incomingCall: null }); // Reset remote ID
                if (remoteVideoRef) remoteVideoRef.srcObject = null;
            },
            clearIncomingCall: () => {
                set({ incomingCall: null })
            }
        }
    ))
)

export default useVideoCallStore