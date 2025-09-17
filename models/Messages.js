import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    conversation: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conversation" }],
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    imageOrVideoUrl: { type: String },
    contentType: { type: String, enum: ["text", "image", "video"], default: "text" },
    reactions: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, emoji: String }],
    messageStatus: { type: String, default: "send" }
}, { timestamps: true });

const Message = mongoose.model("Message", MessageSchema);

export default Message;
