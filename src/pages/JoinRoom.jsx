import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clapperboard, Heart, LockKeyhole } from "lucide-react";
import { roomApi } from "../services/roomApi";
import { useAuth } from "../context/useAuth";
import ErrorText from "../components/common/ErrorText";
import Spinner from "../components/common/Spinner";
export default function JoinRoom() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await roomApi.join(token, roomId.trim(), password);
      navigate(
        `/room/${encodeURIComponent(result.room.roomId || roomId.trim())}`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="room-form-page wrap page-enter">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={15} /> Your space
      </Link>
      <div className="room-form-layout">
        <div className="form-intro">
          <span className="eyebrow">
            <Heart size={14} /> THERE’S A SEAT FOR YOU
          </span>
          <h1>
            Someone saved
            <br />
            <em>you a spot.</em>
          </h1>
          <p>
            Enter the room ID and password they shared with you. That’s all it
            takes.
          </p>
        </div>
        <section className="form-panel">
          <form className="form" onSubmit={submit}>
            <span className="eyebrow">01 / ROOM DETAILS</span>
            <h2>Come on in</h2>
            <p>Ask the host for the room ID and password if you need them.</p>
            <label>
              Room ID
              <span className="input">
                <Clapperboard size={16} />
                <input
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Paste the room ID"
                />
              </span>
            </label>
            <label>
              Room password
              <span className="input">
                <LockKeyhole size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password"
                />
              </span>
            </label>
            <ErrorText>{error}</ErrorText>
            <button className="button primary wide" disabled={busy}>
              {busy ? (
                <>
                  <Spinner /> Joining room...
                </>
              ) : (
                <>
                  Join private room <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
