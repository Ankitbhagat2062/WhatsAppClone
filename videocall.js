import User from "./models/User.js";
// store active users globally
const activeUsers = new Map(); // socket.id -> user info
const VideoCallEvent = (socket, io) => {
    console.log("Video call handler initialized for:", socket.id);

    // ✅ Send socket id to client on connect
    socket.emit("me", socket.id);

    // ✅ When user connects, save them
    socket.on("register-user", async (userId) => {
        const user = await User.findById(userId).select("username profilePicture email");
        if (user) {
            activeUsers.set(socket.id, {
                socketId: socket.id,
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
                email: user.email,
            });
        }

        // ✅ broadcast updated user list
        io.emit("active-users", Array.from(activeUsers.values()));
    });

    // Store ongoing calls: socket.id -> remote socket.id
    const ongoingCalls = new Map();

    socket.on("offer", async ({ to, sdp, fromUserId }) => {
        const caller = await User.findById(fromUserId).select("username profilePicture");

        io.to(to).emit("offer", {
            from: socket.id,
            sdp,
            caller: {
                _id: fromUserId,
                socketId: socket.id,
                username: caller?.username,
                profilePicture: caller?.profilePicture,
            },
        });

        // Mark ongoing call
        ongoingCalls.set(socket.id, to);
        ongoingCalls.set(to, socket.id);

        io.to(to).emit("call-status", { status: "ringing" });
        socket.emit("call-status", { status: "calling" });
    });

    socket.on("answer", ({ to, sdp }) => {
        io.to(to).emit("answer", { from: socket.id, sdp });
        io.to(to).emit("call-status", { status: "connected" });
        socket.emit("call-status", { status: "connected" });
    });

    // Handle hang up
    socket.on("hang-up", ({ to }) => {
        io.to(to).emit("call-ended");
        io.to(to).emit("call-status", { status: "ended" });
        socket.emit("call-status", { status: "ended" });

        ongoingCalls.delete(socket.id);
        ongoingCalls.delete(to);
    });

    // ✅ Cleanup on disconnect
    socket.on("disconnect", () => {
        const remoteSocketId = ongoingCalls.get(socket.id);

        if (remoteSocketId) {
            io.to(remoteSocketId).emit("call-ended");
            io.to(remoteSocketId).emit("call-status", { status: "failed" });
            ongoingCalls.delete(remoteSocketId);
            ongoingCalls.delete(socket.id);
        }

        activeUsers.delete(socket.id);
        io.emit("active-users", Array.from(activeUsers.values()));
    });


    socket.on("toggle-video", ({ to, enabled }) => {
        io.to(to).emit("remote-toggle-video", { enabled });
    });

    socket.on("toggle-audio", ({ to, enabled }) => {
        io.to(to).emit("remote-toggle-audio", { enabled });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
        io.to(to).emit("ice-candidate", { candidate });
    });
};

export default VideoCallEvent;
