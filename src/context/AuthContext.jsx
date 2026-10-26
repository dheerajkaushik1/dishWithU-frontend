import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi";
import { createRoomSocket } from "../services/socket";
import { Auth } from "./authContextValue";
const TOKEN_KEY = "dishwithu.token";

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem(TOKEN_KEY)),
  );
  const [notice, setNotice] = useState("");

  const connectSocket = useCallback((authToken) => {
    if (socketRef.current) return socketRef.current;
    const connection = createRoomSocket(authToken);
    socketRef.current = connection;
    setSocket(connection);
    const onConnectError = (error) => {
      if (/expired|invalid token|authentication required/i.test(error.message))
        window.dispatchEvent(new Event("dishwithu:expired"));
    };
    connection.on("connect_error", onConnectError);
    return connection;
  }, []);

  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    authApi
      .profile(token)
      .then((result) => {
        if (active) {
          setUser(result.user);
          connectSocket(token);
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          setNotice("Your session expired. Please sign in again.");
          navigate("/login", { replace: true });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, navigate, connectSocket]);

  useEffect(() => () => socketRef.current?.disconnect(), []);

  useEffect(() => {
    const expire = () => {
      localStorage.removeItem(TOKEN_KEY);
      disconnectSocket();
      setToken(null);
      setUser(null);
      setNotice("Your session expired. Please sign in again.");
      navigate("/login", { replace: true });
    };
    window.addEventListener("dishwithu:expired", expire);
    return () => window.removeEventListener("dishwithu:expired", expire);
  }, [navigate, disconnectSocket]);

  const signIn = (result) => {
    localStorage.setItem(TOKEN_KEY, result.token);
    connectSocket(result.token);
    setToken(result.token);
    setUser(result.user);
    setNotice("");
  };
  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    disconnectSocket();
    setToken(null);
    setUser(null);
    navigate("/", { replace: true });
  };
  return (
    <Auth.Provider
      value={{
        token,
        user,
        socket,
        loading,
        notice,
        setNotice,
        signIn,
        signOut,
      }}
    >
      {children}
    </Auth.Provider>
  );
}
