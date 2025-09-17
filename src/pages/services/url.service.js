import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_API_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default axiosInstance;
