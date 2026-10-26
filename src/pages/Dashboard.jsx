import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Clapperboard, Film, Heart, LockKeyhole, Radio, UserRound, UsersRound } from "lucide-react";
import { useAuth } from "../context/useAuth";
export default function Dashboard() {
  const { user, socket } = useAuth();
  const location = useLocation();
  return (
    <main className="dashboard wrap page-enter">
      {location.state?.roomClosed && (
        <div className="notice" role="status">{location.state.roomClosed}</div>
      )}
      <div className="welcome">
        <div>
          <span className="eyebrow">
            <i className="live-dot" /> YOUR PRIVATE SPACE
          </span>
          <h1>
            Good to see you,
            <br />
            <em>{user?.username}.</em>
          </h1>
          <p>Who’s getting the popcorn?</p>
        </div>
        <Link to="/profile" className="profile-chip">
          <UserRound size={17} /> Profile <ArrowUpRight size={14} />
        </Link>
      </div>
      <section className="action-grid">
        <Link to="/rooms/create" className="action-card create">
          <span className="action-icon">
            <Clapperboard size={20} />
          </span>
          <small>START SOMETHING</small>
          <h2>Create a room</h2>
          <p>Make a private space and invite someone in.</p>
          <b>
            Set it up <ArrowUpRight size={15} />
          </b>
          <Film className="card-art" size={93} />
        </Link>
        <Link to="/rooms/join" className="action-card join">
          <span className="action-icon">
            <UsersRound size={20} />
          </span>
          <small>YOU’RE INVITED</small>
          <h2>Join a room</h2>
          <p>Have a room ID and password? You’re one step away.</p>
          <b>
            Enter room details <ArrowUpRight size={15} />
          </b>
          <Heart className="card-art" size={87} />
        </Link>
      </section>
      <section className="dashboard-lower">
        <div>
          <LockKeyhole size={18} />
          <span>
            <b>Just your invited people</b>
            <small>Private rooms have space for two participants.</small>
          </span>
        </div>
        <div>
          <i className={socket?.connected ? "live-dot" : "wait-dot"} />
          <span>
            <b>REAL-TIME CONNECTION</b>
            <small>
              {socket?.connected
                ? "Connected and ready"
                : "Connecting to room service..."}
            </small>
          </span>
          <Radio size={17} />
        </div>
      </section>
      <p className="footnote">
        Room presence and conversation are live while your room is open.
      </p>
    </main>
  );
}
