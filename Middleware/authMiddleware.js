import jwt from 'jsonwebtoken';
import Response from '../utills/responseHandler.js';

const authMiddleware = (req, res, next) => {
    const authtoken = req.cookies.auth_token;
    if (!authtoken) {
        return Response(res, 401, "Unauthorized");
    }
    try {
        const decoded = jwt.verify(authtoken, process.env.JWT_SECRET);
        req.user = decoded;
        // console.log(`User authenticated: ${authtoken}`);
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        return Response(res, 401, "Unauthorized");
    }
};

export default authMiddleware;

