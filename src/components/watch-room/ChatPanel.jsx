import { Heart, Send, UserRound, X } from "lucide-react";

export default function ChatPanel({
  messages,
  myId,
  chatVisible,
  isFullscreen,
  socketStatus,
  chatPanelRef,
  chatEndRef,
  chatError,
  onClose,
  onSendMessage,
  messageDraft,
  onMessageDraftChange,
  socketConnected,
}) {
  return (
    <aside className={`room-side ${chatVisible ? "open" : ""} ${isFullscreen ? (chatVisible ? "fullscreen-chat" : "fullscreen-chat-closed") : ""}`} aria-hidden={!chatVisible} inert={!chatVisible}>
      <section className="chat-panel" ref={chatPanelRef}>
        <div className="chat-panel-head"><div><h2>Room Chat</h2></div><span className="chat-live"><i className={socketStatus === "connected" ? "live-dot" : "wait-dot"} /> {socketStatus === "connected" ? "Live" : "Reconnecting"}</span><button className="icon-btn" onClick={onClose} title="Close chat" aria-label="Close chat"><X size={16} /></button></div>
        <div className="chat-messages" aria-live="polite">
          {messages.length === 0 ? <div className="chat-empty"><span className="chat-empty-icon"><Heart size={18} /></span><b>No messages yet</b><p>Send the first note while your movie gets ready.</p></div> : messages.map((message) => {
            const own = String(message.userId) === String(myId);
            return <article className={`chat-message ${own ? "own" : ""}`} key={message.id}><span className="chat-avatar" aria-label={message.username || "Participant"}>{message.username?.trim()?.slice(0, 1)?.toUpperCase() || <UserRound size={13} />}</span><div className="chat-message-body"><p>{message.message}</p></div></article>;
          })}
          <div ref={chatEndRef} />
        </div>
        {chatError && <p className="chat-error" role="alert">{chatError}</p>}
        <form className="chat-composer" onSubmit={onSendMessage}><input aria-label="Write a message" maxLength={500} value={messageDraft} onChange={onMessageDraftChange} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) onSendMessage(event); }} placeholder="Type a message..." disabled={!socketConnected} /><button className="send-message" type="submit" disabled={!socketConnected || !messageDraft.trim()} aria-label="Send message" title="Send message"><Send size={15} /></button></form>
      </section>
    </aside>
  );
}
