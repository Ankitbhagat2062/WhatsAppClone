import otpGenerate from "../utills/otpGenerator.js";
import User from "../models/User.js";
import Response from "../utills/responseHandler.js";
import { sendOtptoEmail } from "../services/emailService.js";
import twilloService from '../services/twilloService.js';
import generateToken from "../utills/generateToken.js";
import { uploadFileToCloudinary } from "../Config/cloudinaryConfig.js";
import Conversation from "../models/Conversation.js";
//Step 1 SendOtp
const sendOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = await otpGenerate();
    const Expiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
    let user;
    try {
        if (email) {
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({ email });
            }
            user.emailOtp = otp;
            user.emailOtpExpiry = Expiry;
            await user.save();
            await sendOtptoEmail(email, otp , user);
            console.log(`User's Data: ${ user }`);
            return Response(res, 200, "OTP sent successfully", { email });
        }
        if (!phoneNumber || !phoneSuffix) {
            return Response(res, 400, "Phone number and suffix are required");
        }
        const fullphoneNumber = `${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({ phoneNumber });
        if (!user) {
            user = new User({ phoneNumber, phoneSuffix });
        }
        await twilloService.sendOtptophoneNumber(fullphoneNumber);
        await user.save();
        return Response(res, 200, 'Otp sent successfully', user)
    }
    catch (error) {
        console.error("Error sending OTP:", error);
        return Response(res, 500, "Internal server error");
    }
}

// Step 2 Verify Otp
const verifyOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email, otp } = req.body;
    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
            if (!user) {
                return Response(res, 404, "User not found");
            }
            const now = new Date();
            if (!user.emailOtp || String(user.emailOtp) !== String(otp) || now > new Date(user.emailOtpExpiry)) {
                return Response(res, 400, "OTP has expired");
            }
            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
            console.log(`OTP verified successfully for email: ${user.email}`);
        } else {
            if (!phoneNumber || !phoneSuffix) {
                return Response(res, 400, "Phone number and suffix are required");
            }
            const fullphoneNumber = `${phoneSuffix}${phoneNumber}`;
            user = await User.findOne({ phoneNumber });
            if (!user) {
                return Response(res, 404, "User not found");
            }
            const result = await twilloService.verifyotp(fullphoneNumber, otp);
            if (result.status !== 'approved') {
                return Response(res, 400, "OTP verification failed");
            }
            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user?._id);
        res.cookie("auth_token", token, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
        const userObject = user.toObject(); // Ensure userObject is always a plain object
        console.log(token, userObject)
        return Response(res, 200, "OTP verified successfully", { token, user: userObject });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        // Ensure the payload is a plain object in the error response as well
        return Response(res, 500, "Internal server error", null); // Pass null or an empty object for data
    }
};
const updateProfile = async (req, res) => {
    const { username, agreed, about, avatarUrl } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return Response(res, 404, "User not found", req.user);
        }
        
        console.log('Received update profile request:');
        console.log('File:', req.file);
        console.log('Body:', req.body);
        console.log('User ID:', req.user.id);
        
        const file = req.file;
        if (file) {
            console.log('Processing file upload to Cloudinary...');
            console.log('File details:', {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path
            });
            
            try {
                const uploadResult = await uploadFileToCloudinary(file);
                user.profilePicture = uploadResult.secure_url;
                console.log('Cloudinary upload successful:', uploadResult.secure_url);
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                throw uploadError;
            }
        } else if (req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
            console.log('Using profilePicture from body');
        } else if (avatarUrl) {
            user.profilePicture = avatarUrl;
            console.log('Using avatarUrl from body');
        } else {
            console.log('No file or profile picture URL provided');
        }
        
        if (username) {
            user.username = username;
            console.log('Updating username:', username);
        }
        if (agreed) {
            user.agreed = agreed;
            console.log('Updating agreed:', agreed);
        }
        if (about) {
            user.about = about;
            console.log('Updating about:', about);
        }
        
        await user.save();
        console.log('User profile saved successfully',user);
        return Response(res, 200, "User Profile updated successfully", user);
    } catch (error) {
        console.error("Error updating profile:", error);
        console.error("Error stack:", error.stack);
        return Response(res, 500, "Internal server error");
    }
}
const checkAuthenticated = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return Response(res, 404, "Unauthorized User. Please Login before accessing our app");
        }
        const user = await User.findById(userId);
        if (!user) {
            return Response(res, 404, "User not found");
        }
        return Response(res, 200, "User is authenticated", user);
    } catch (error) {
        console.error("Error verifying token:", error);
        return Response(res, 401, "Unauthorized");
    }
};
const logout = async (req, res) => {
    try {
        res.cookie("auth_token", "", { expires: new Date(0) });
        return Response(res, 200, "Logged out successfully");
    } catch (error) {
        console.error("Error logging out:", error);
        return Response(res, 500, "Internal server error");
    }
};

const getAllUsers = async (req, res) => {
    const loggedInUser = req.user.id;
    try {
        const users = await User.find({ _id: { $ne: loggedInUser } })
        .select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix").lean();
        const usersWithConversation = await Promise.all(
            users.map(async (user) => {
               const conversation  = await Conversation.findOne({
                   participants: { $all: [loggedInUser, user?._id] }
               }).populate({
                   path: "lastMessage",
                   select: "content createdAt sender receiver",
               }).lean();
               return {
                   ...user,
                   conversation: conversation || null
               };
            })
        );
        return Response(res, 200, "Users retrieved successfully", usersWithConversation);
    } catch (error) {
        console.error("Error retrieving users:", error);
        return Response(res, 500, "Internal server error");
    }
};
export default { sendOtp, verifyOtp, updateProfile, logout, checkAuthenticated, getAllUsers };