import axiosInstances from "./url.service";

export const sendOtp = async(phoneNumber,phoneSuffix,email)=>{
    try {
        const response = await axiosInstances.post(`/auth/send-otp`, { phoneNumber, phoneSuffix, email });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}
export const verifyOtp = async(phoneNumber,phoneSuffix,email,otp)=>{
    try {
        const response = await axiosInstances.post(`/auth/verify-otp`, { phoneNumber, phoneSuffix, email, otp });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}
export const updateUserProfile = async(updateData)=>{
    try {
        const response = await axiosInstances.put(`/auth/update-profile`, updateData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}
export const checkUserAuth = async()=>{
    try {
        const response = await axiosInstances.get(`/auth/check-auth`);
        if (response.data.status === "success") {
            return {isAuthenticated: true , user : response?.data?.data};
        }else if (response.data.status === "error") {
            return {isAuthenticated: false};
        }
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}
export const logout = async()=>{
    try {
        const response = await axiosInstances.get(`/auth/logout`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}
export const getAllUsers = async()=>{
    try {
        const response = await axiosInstances.get(`/auth/get-all-users`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}