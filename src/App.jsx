import React, { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/user-login/Login';
import Home from './pages/Home';
import { ProtectedRoute, PublicRoute } from './Protected.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './Components/HomePage';
import UserDetails from './Components/UserDetails.jsx';
import Status from './pages/StatusSection/Status.jsx';
import Setting from './pages/SettingSection/Setting.jsx';
import Help from './pages/SettingSection/Help.jsx';

// import Layout from './Components/Layout.jsx';
import useUserStore from './store/useUserStore.js';
import { initializeSocket, disconnectSocket } from './pages/services/chat.service.js';
import useChatStore from './store/chatStore.js';
function App() {
  const cleanup = useChatStore.getState().cleanup; // static reference
  const setCurrentUser = useChatStore.getState().setCurrentUser; // static reference
  const initsocketListeners = useChatStore.getState().initsocketListeners; // static reference

  const { user } = useUserStore();
  useEffect(() => {
    if (!user?._id) return;

    const socket = initializeSocket();
    if (socket) {
      setCurrentUser(user);
      initsocketListeners();
    }
     // disconnect ONLY when page unloads (refresh/close)
    const handleBeforeUnload = () => {
      disconnectSocket();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cleanup()
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // }, [user, setCurrentUser , cleanup , initsocketListeners ]); // only run if user._id changes
  }, [user?._id ]); // only run if user._id changes

  const RootRoute = () => {
    const isAuthenticated = useUserStore(state => state.isAuthenticated);
    if (isAuthenticated) {
      return <HomePage />;
    } else {
      return <Home />;
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/user-login" element={<PublicRoute><Login /></PublicRoute>} />

          <Route path="/user-profile" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
          <Route path="/status" element={<ProtectedRoute><Status /></ProtectedRoute>} />
          <Route path="/setting" element={<ProtectedRoute><Setting /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />

        </Routes>
      </Router>
    </>
  )
}

export default App


