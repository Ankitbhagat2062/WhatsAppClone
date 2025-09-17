import express from 'express';
import statusController from '../Controllers/statusController.js';
import authMiddleware from '../Middleware/authMiddleware.js';
import { multerMiddleware } from '../Config/cloudinaryConfig.js';

const router = express.Router();

// Auth routes
router.post("/", authMiddleware,multerMiddleware, statusController.createStatus);
router.get("/",authMiddleware, statusController.getStatuses);


// Protect routes
router.put("/:statusId/view",authMiddleware,statusController.viewStatus);

router.delete("/:statusId",authMiddleware,statusController.deleteStatus);

export default router;