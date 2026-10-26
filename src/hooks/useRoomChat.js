import { useCallback, useEffect, useRef, useState } from "react";

export default function useRoomChat(socket, roomId, chatOpenRef) {
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [chatError, setChatError] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const onHistory = useCallback((history) => {
    if (Array.isArray(history)) setMessages(history);
  }, []);

  const onMessage = useCallback((message) => {
    setMessages((current) =>
      current.some((item) => item.id === message.id)
        ? current
        : [...current, message],
    );
    if (!chatOpenRef.current) {
      setUnreadMessages((count) => count + 1);
    }
  }, [chatOpenRef]);

  const sendMessage = useCallback((event) => {
    event?.preventDefault();
    const message = messageDraft.trim();
    if (!message || !socket?.connected) {
      if (message && !socket?.connected) {
        setChatError("Reconnecting to the room. Your message wasn’t sent.");
      }
      return;
    }
    socket.emit("chat:message", { roomId, message });
    setMessageDraft("");
    setChatError("");
  }, [messageDraft, roomId, socket]);

  return {
    messages,
    messageDraft,
    setMessageDraft,
    chatError,
    setChatError,
    unreadMessages,
    setUnreadMessages,
    chatEndRef,
    onHistory,
    onMessage,
    sendMessage,
  };
}
