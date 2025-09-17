import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useUserStore from "./store/useUserStore.js";
import { checkUserAuth } from "./pages/services/user.service.js";
import Loader from "./utils/Loader.jsx";

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const setUser = useUserStore(state => state.setUser);
  const clearUser = useUserStore(state => state.clearUser);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsChecking(true);
      try {
        const result = await checkUserAuth();
        if (result?.isAuthenticated) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (error) {
        console.error("Error verifying auth:", error);
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, [setUser, clearUser]);

  if (isChecking) return <Loader/>

  if (!isAuthenticated) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
