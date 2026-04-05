import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, registerUser, resendVerification, requestPasswordReset, resetPassword, verifyEmail } from "../services/churnApi";
import { clearAuth, getToken, getUser, isPersistentAuth, saveAuth } from "../services/authStorage";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        if (!mounted) return;

        const currentUser = response?.data?.user || null;
        setUser(currentUser);
        saveAuth(getToken(), currentUser, isPersistentAuth());
      } catch (error) {
        if (!mounted) return;
        clearAuth();
        setToken("");
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials, options = {}) => {
    const response = await loginUser(credentials);
    const nextToken = response?.data?.token || "";
    const nextUser = response?.data?.user || null;
    const rememberMe = options.rememberMe !== false;

    saveAuth(nextToken, nextUser, rememberMe);
    setToken(nextToken);
    setUser(nextUser);

    return response;
  }

  const register = async (payload) => {
    const response = await registerUser(payload);
    const nextToken = response?.data?.token || "";
    const nextUser = response?.data?.user || null;

    if (nextToken && nextUser) {
      saveAuth(nextToken, nextUser);
      setToken(nextToken);
      setUser(nextUser);
    } else {
      clearAuth();
      setToken("");
      setUser(null);
    }

    return response;
  }

  const verifyEmailToken = async (payload) => {
    const response = await verifyEmail(payload);
    const nextToken = response?.data?.token || "";
    const nextUser = response?.data?.user || null;

    if (nextToken && nextUser) {
      saveAuth(nextToken, nextUser);
      setToken(nextToken);
      setUser(nextUser);
    }

    return response;
  }

  const resendVerificationEmail = async (payload) => {
    return resendVerification(payload);
  }

  const forgotPassword = async (payload) => {
    return requestPasswordReset(payload);
  }

  const resetPasswordToken = async (payload) => {
    const response = await resetPassword(payload);
    const nextToken = response?.data?.token || "";
    const nextUser = response?.data?.user || null;

    if (nextToken && nextUser) {
      saveAuth(nextToken, nextUser);
      setToken(nextToken);
      setUser(nextUser);
    }

    return response;
  }

  const logout = () => {
    clearAuth();
    setToken("");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      verifyEmailToken,
      resendVerificationEmail,
      forgotPassword,
      resetPasswordToken,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
