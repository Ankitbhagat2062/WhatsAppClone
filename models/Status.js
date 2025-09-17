import mongoose from "mongoose";

const ContentSchema = new mongoose.Schema({
  content: { type: String, required: true }, // text message or media URL
  contentType: { type: String, enum: ["text", "image", "video"], required: true }
});

const StatusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contents: [ContentSchema], // 👈 multiple items now
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Status", StatusSchema);
