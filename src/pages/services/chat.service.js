import {io} from 'socket.io-client';
import  useUserStore  from '../../store/useUserStore.js';

let socket = null;

export const initializeSocket = () => {
    if (socket && socket.connected) return socket;
    
    // If socket exists but is disconnected, reconnect it
    if (socket && !socket.connected) {
        socket.connect();
        return socket;
    }

    const user = useUserStore.getState().user;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL
    socket = io(`${BACKEND_URL}`, {
        withCredentials: true,
        transports: ['websocket','polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        autoConnect: false // Prevent automatic connection
    });
   
    socket.on('connect', () => {
        console.log('socket connected:', socket.id);
        if (user?._id) {
            socket.emit('user_connected', user._id);
        }
    });

    socket.on('connect_error', (error) => {
        console.error('socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('socket disconnected:', reason);
    });

    // Manually connect after setting up listeners
    socket.connect();
    
    return socket;
};

export const getSocket = () => {
    if(socket){
         return socket;
    }else{
       return initializeSocket();
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
