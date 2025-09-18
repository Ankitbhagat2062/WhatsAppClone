import jwt from 'jsonwebtoken';
import Response from '../utills/responseHandler.js';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const tokenFromCookie = req.cookies.auth_token;
    const authtoken = tokenFromHeader || tokenFromCookie;
    if (!authtoken) {
        return Response(res, 401, "Unauthorized : Auth_token not recived");
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

