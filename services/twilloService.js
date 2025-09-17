import Twilio from "twilio";

// Twilio configuration
const accountsid = process.env.TWILLO_ACCOUNT_SID;
const authtoken = process.env.TWILLO_AUTH_TOKEN;
const servicesid = process.env.TWILLO_SERVICE_SID;

const Client = new Twilio(accountsid, authtoken);

const sendOtptophoneNumber = async (phoneNumber) => {
    try {
        console.log("sending OTP to this phoneNumber", phoneNumber);
        if (!phoneNumber) {
            throw new Error("Phone number is required");
        }
        const response = await Client.verify.v2.services(servicesid).verifications.create({
            to: phoneNumber,
            channel: "sms"
        });
        console.log(`This is my Otp Response`, response);
        return response;
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
    }
};

const verifyotp = async (phoneNumber, otp) => {
    try {
        console.log("Verifying OTP for phoneNumber", phoneNumber);
        console.log("OTP to verify:", otp);
        const response = await Client.verify.v2.services(servicesid).verificationChecks.create({
            to: phoneNumber,
            code: otp
        });
        console.log(`This is my Otp Response`, response);
        return response;
    } catch (error) {
        console.error("Error verifying OTP:", error);
        throw new Error("OTP Verification Failed");
    }
};

export default { sendOtptophoneNumber, verifyotp };
