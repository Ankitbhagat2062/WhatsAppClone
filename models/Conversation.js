import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    unread: [{ type: Number, default:0}],
},{timestamps:true});

const Conversation = mongoose.model("Conversation", ConversationSchema);

export default Conversation;
