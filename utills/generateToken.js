import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    // Make sure payload is always a plain object
    console.log(`Generating token for user: ${userId}`);
    return jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, { expiresIn: "1y" });
};

export default generateToken;
