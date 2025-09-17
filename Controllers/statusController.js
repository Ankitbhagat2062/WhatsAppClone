import Status from "../models/Status.js";
import Response from "../utills/responseHandler.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadFileToCloudinary } from "../Config/cloudinaryConfig.js";

const createStatus = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    const file = req.file;

    let contents = [];

    // if file exists -> upload to cloudinary
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return Response(res, 400, "Error uploading file");
      }

      if (file.mimetype.startsWith("image")) {
        contents.push({ content: uploadFile.secure_url, contentType: "image" });
      } else if (file.mimetype.startsWith("video")) {
        contents.push({ content: uploadFile.secure_url, contentType: "video" });
      } else {
        return Response(res, 400, "Unsupported file type");
      }
    }

    // if text content exists
    if (content?.trim()) {
      contents.push({ content: content.trim(), contentType: "text" });
    }

    if (contents.length === 0) {
      return Response(res, 400, "Message Content or file is required");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const status = new Status({
      user: userId,
      contents,
      expiresAt,
    });

    await status.save();

    const populateStatus = await Status.findById(status._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    // Emit socket event
    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("newStatus", populateStatus);
        }
      }
    }

    return Response(res, 200, "Status sent successfully", populateStatus);
  } catch (error) {
    console.error("Error sending status:", error);
    return Response(res, 500, "Internal server error");
  }
};

const getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({ expiresAt: { $gt: new Date() } })
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .sort({ createdAt: -1 });
        return Response(res, 200, "Statuses fetched successfully", statuses);
    } catch (error) {
        console.error("Error fetching statuses:", error);
        return Response(res, 500, "Internal server error");
    }
};

const viewStatus = async (req, res) => {
    try {
        const { statusId } = req.params;
        const userId = req.user.id;

        // Find the status and update the viewers list
        const status = await Status.findById(statusId);
        if (!status) {
            return Response(res, 404, "Status not found");
        }

        // Check if the user has already viewed the status
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();
            const updatedStatus = await Status.findById(statusId)
                .populate("user", "username profilePicture")
                .populate("viewers", "username profilePicture");
            
            // Emit Socket Event
            if (req.io && req.socketUserMap) {
                const statusOwnerSocketId = req.socketUserMap.get(status.user._id.toString());
                if (statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewer: userId,
                        totalviewers: updatedStatus.viewers.length,
                        viewers: updatedStatus.viewers
                    };
                    // Notify the status owner about the view
                    req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
                }else{
                    console.log("Status owner socket ID not found");
                }
            }
        } else {
            console.log("User has already viewed the status");
        }

        return Response(res, 200, "Status viewed successfully", status);
    } catch (error) {
        console.error("Error viewing status:", error);
        return Response(res, 500, "Internal server error");
    }
};

const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user.id;

    // Find the status
    const status = await Status.findById(statusId);
    if (!status) {
      return Response(res, 404, "Status not found");
    }

    // Check if the user is the owner
    if (status.user.toString() !== userId) {
      return Response(res, 403, "You are not authorized to delete this status");
    }

    // Delete files from Cloudinary (if any media exists in contents)
    if (Array.isArray(status.contents)) {
      for (const file of status.contents) {
        if (file.contentType === "image" || file.contentType === "video") {
          try {
            // Extract public_id from URL
            const url = file.content;
            const parts = url.split("/");
            const fileName = parts[parts.length - 1]; // e.g. abcd1234.png
            const publicId = fileName.split(".")[0];  // e.g. abcd1234

            const resourceType = file.contentType === "video" ? "video" : "image";

            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

            console.log(`✅ Deleted from Cloudinary: ${publicId}`);
          } catch (err) {
            console.error("Cloudinary delete error:", err.message);
          }
        }
      }
    }

    // Delete from MongoDB
    await status.deleteOne();

    // Emit Socket Event
    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }

    return Response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.error("Error deleting status:", error);
    return Response(res, 500, "Internal server error");
  }
};

export default { createStatus, getStatuses, viewStatus, deleteStatus };