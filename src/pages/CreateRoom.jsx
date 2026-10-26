import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clapperboard, Copy, Info, LockKeyhole, MonitorPlay, ShieldCheck, UsersRound } from "lucide-react";
import { roomApi } from "../services/roomApi";
import { useAuth } from "../context/useAuth";
import ErrorText from "../components/common/ErrorText";
import Spinner from "../components/common/Spinner";
export default function CreateRoom() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await roomApi.create(token, password);
      setRoomId(result.room.roomId);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <main className="room-form-page wrap page-enter">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={15} /> Your space
      </Link>
      <div className="room-form-layout">
        <div className="form-intro">
          <span className="eyebrow">
            <Clapperboard size={14} /> THE HOST’S CORNER
          </span>
          <h1>
            Set the scene.
            <br />
            <em>Invite your person.</em>
          </h1>
          <p>
            Your room is private, password protected, and just the right size
            for a proper movie night.
          </p>
          <div className="stamps">
            <span>
              <ShieldCheck size={15} /> Private by default
            </span>
            <span>
              <UsersRound size={15} /> Two seats, max
            </span>
          </div>
        </div>
        <section className="form-panel">
          {roomId ? (
            <div className="created">
              <span className="success">
                <Check size={21} />
              </span>
              <span className="eyebrow">YOUR ROOM IS READY</span>
              <h2>Now bring them in.</h2>
              <p>
                Share this room ID and the password you chose with your guest.
              </p>
              <div className="room-id">
                <b>{roomId}</b>
                <button
                  className="icon-btn"
                  onClick={copy}
                  aria-label="Copy room ID"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <button
                className="button primary wide"
                onClick={() => navigate(`/room/${encodeURIComponent(roomId)}`)}
              >
                Enter your room <MonitorPlay size={16} />
              </button>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <span className="eyebrow">01 / ROOM ACCESS</span>
              <h2>A password for your room</h2>
              <p>
                Choose something your guest can enter. At least four characters.
              </p>
              <label>
                Room password
                <span className="input">
                  <LockKeyhole size={16} />
                  <input
                    type="password"
                    minLength={4}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Make it easy to share"
                  />
                </span>
              </label>
              <ErrorText>{error}</ErrorText>
              <div className="hint">
                <Info size={16} /> Your room theme is saved with the room and can
                be changed later by the host.
              </div>
              <button className="button primary wide" disabled={busy}>
                {busy ? (
                  <>
                    <Spinner /> Creating room...
                  </>
                ) : (
                  <>
                    Create private room <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
