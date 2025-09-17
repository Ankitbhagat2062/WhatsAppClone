import express from 'express';
import auth from '../Controllers/auth.js';
import authMiddleware from '../Middleware/authMiddleware.js';
import { multerMiddleware } from '../Config/cloudinaryConfig.js';

const router = express.Router();

// Auth routes
router.post("/send-otp", auth.sendOtp);
router.post("/verify-otp", auth.verifyOtp);
router.get("/logout", auth.logout);
router.get("/check-auth",authMiddleware, auth.checkAuthenticated);
router.get('/get-all-users', authMiddleware, auth.getAllUsers);


// Protect routes
router.put("/update-profile",authMiddleware,multerMiddleware,auth.updateProfile);
export default router;