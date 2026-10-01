import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clapperboard,
  Copy,
  Film,
  Heart,
  Info,
  LockKeyhole,
  LogOut,
  Mail,
  Maximize,
  MessageCircle,
  Menu,
  MonitorPlay,
  PanelLeft,
  Pause,
  Palette,
  Play,
  Radio,
  RotateCw,
  Send,
  Settings,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  Smile,
  Upload,
  UserRound,
  UsersRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { authApi, roomApi } from "./services/api";
import { createRoomSocket } from "./services/socket";
import "./styles.css";

const Auth = createContext(null);
const TOKEN_KEY = "dishwithu.token";
const useAuth = () => useContext(Auth);
const ROOM_THEMES = [
  { id: "LOVE", label: "Love", detail: "A warm little glow for two", icon: Heart },
  { id: "FAMILY", label: "Family", detail: "A cozy night in", icon: UsersRound },
  { id: "FRIENDSHIP", label: "Friendship", detail: "Your movie-night energy", icon: Sparkles },
];
const THEME_REACTIONS = {
  LOVE: ["❤️", "🥰", "😍", "😘", "💖", "✨"],
  FAMILY: ["❤️", "😊", "😂", "👏", "🤗", "👍", "🏠"],
  FRIENDSHIP: ["😂", "🔥", "🤣", "🙌", "😎", "👏", "💀", "🫶"],
};
const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}` : `${minutes}:${String(remainder).padStart(2, "0")}`;
};

function AuthProvider({ children }) {
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

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
function ErrorText({ children }) {
  return children ? (
    <div className="error-box" role="alert">
      {children}
    </div>
  ) : null;
}

function Frame({ children }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const roomRoute = location.pathname.startsWith("/room/");
  return (
    <div className={`app-shell ${roomRoute ? "room-shell" : ""}`}>
      <header className="topbar">
        <Link className="brand" to={user ? "/dashboard" : "/"}>
          <span className="brand-icon">
            <Heart size={16} fill="currentColor" />
          </span>
          <span>
            dish with <b>u</b>
          </span>
        </Link>
        <button
          className="menu-toggle icon-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav className={open ? "nav open" : "nav"}>
          <NavLink
            to={user ? "/dashboard" : "/"}
            onClick={() => setOpen(false)}
          >
            {user ? "Your space" : "Home"}
          </NavLink>
          <NavLink to="/about" onClick={() => setOpen(false)}>
            About
          </NavLink>
          <a href="/#features" onClick={() => setOpen(false)}>
            Features
          </a>
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="nav-user"
                onClick={() => setOpen(false)}
              >
                <UserRound size={15} />
                {user.username}
              </NavLink>
              <button className="nav-out" onClick={signOut}>
                <LogOut size={15} />
                Sign out
              </button>
            </>
          ) : (
            <div className="nav-auth-actions">
              <Link className="nav-login" to="/login">Login</Link>
              <Link className="nav-cta" to="/register">Sign Up <ArrowUpRight size={14} /></Link>
            </div>
          )}
        </nav>
      </header>
      {children}
      {!roomRoute && (
        <footer className="footer">
          <div className="footer-grid">
            <div>
              <Link className="brand footer-brand" to="/">
                <span className="brand-icon">
                  <Heart size={15} fill="currentColor" />
                </span>
                <span>
                  dish with <b>u</b>
                </span>
              </Link>
              <p>Good stories are better together.</p>
            </div>
            <div className="footer-col">
              <b>EXPLORE</b>
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to={user ? "/rooms/create" : "/login"}>Create a room</Link>
              <Link to={user ? "/rooms/join" : "/login"}>Join a room</Link>
            </div>
            <div className="footer-col">
              <b>BUILT WITH</b>
              <span>React · Node.js · Express</span>
              <span>MongoDB · Socket.IO · WebRTC</span>
            </div>
            <div className="footer-credit">
              <span>© 2024 DishWithU. All rights reserved.</span>
              <span>
                Made with <Heart size={12} fill="currentColor" /> by Dheeraj Kaushik
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  return loading ? (
    <div className="loader">
      <Spinner />
      <p>Getting your room ready</p>
    </div>
  ) : user ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

function AuthLayout({ title, subtitle, children, foot }) {
  return (
    <main className="auth-page page-enter">
      <aside className="auth-art">
        <Link to="/" className="back-home">
          <ArrowLeft size={15} /> Back home
        </Link>
        <div>
          <span className="eyebrow">
            <Heart size={13} /> YOUR PEOPLE, YOUR PICTURE
          </span>
          <h2>
            Some things are just better <em>together.</em>
          </h2>
          <p>
            A little room for the people you love and the stories you want to
            share.
          </p>
          <div className="doodle">
            <i />
            <i />
            <i />
          </div>
        </div>
        <small>Private rooms. Real-time connection.</small>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <span className="kicker">DISH WITH U</span>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          {foot}
        </div>
      </section>
    </main>
  );
}

function Login() {
  const { user, signIn, notice, setNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      signIn(await authApi.login(form));
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in and pick up where your people are."
      foot={
        <p className="auth-foot">
          New to Dish With U?{" "}
          <Link to="/register">
            Create an account <ArrowRight size={14} />
          </Link>
        </p>
      }
    >
      {location.state?.registered && (
        <div className="notice">
          Your account is ready. Sign in to continue.
        </div>
      )}
      {notice && (
        <div className="notice">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <form className="form" onSubmit={submit}>
        <label>
          Email address
          <span className="input">
            <Mail size={16} />
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </span>
        </label>
        <label>
          Password
          <span className="input">
            <LockKeyhole size={16} />
            <input
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </span>
        </label>
        <ErrorText>{error}</ErrorText>
        <button className="button primary wide" disabled={busy}>
          {busy ? (
            <>
              <Spinner /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout
      title="Come on in."
      subtitle="Create your account. Your next movie night is waiting."
      foot={
        <p className="auth-foot">
          Already have an account?{" "}
          <Link to="/login">
            Sign in <ArrowRight size={14} />
          </Link>
        </p>
      }
    >
      <form className="form" onSubmit={submit}>
        <label>
          Username
          <span className="input">
            <UserRound size={16} />
            <input
              autoComplete="username"
              required
              maxLength={40}
              placeholder="What should we call you?"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </span>
        </label>
        <label>
          Email address
          <span className="input">
            <Mail size={16} />
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </span>
        </label>
        <label>
          Password
          <span className="input">
            <LockKeyhole size={16} />
            <input
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </span>
        </label>
        <label>
          Confirm password
          <span className="input">
            <LockKeyhole size={16} />
            <input
              type="password"
              autoComplete="new-password"
              required
              placeholder="Enter it once more"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </span>
        </label>
        <ErrorText>{error}</ErrorText>
        <button className="button primary wide" disabled={busy}>
          {busy ? (
            <>
              <Spinner /> Creating account...
            </>
          ) : (
            <>
              Create account <ArrowRight size={16} />
            </>
          )}
        </button>
        <small className="form-note">
          The API creates your account; sign in afterward to receive your
          session.
        </small>
      </form>
    </AuthLayout>
  );
}

function Home() {
  const { user } = useAuth();
  return (
    <main className="page-enter">
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow">
            <i className="live-dot" /> A SMALL ROOM FOR A BIG SCREEN
          </span>
          <h1>
            Same movie.
            <br />
            <em>Same moment.</em>
          </h1>
          <p>
            Private watch rooms for the people you wish were on your couch. Pick
            a local video, invite your person, and press play.
          </p>
          <div className="hero-actions">
            <Link
              className="button primary"
              to={user ? "/dashboard" : "/register"}
            >
              {user ? "Go to your space" : "Start your first room"}{" "}
              <ArrowRight size={16} />
            </Link>
            <Link className="text-link" to="/about">
              How it works <ArrowDown size={15} />
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <LockKeyhole size={15} /> Private rooms
            </span>
            <i />
            <span>
              <Radio size={15} /> Peer-to-peer video
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="screen">
            <div className="screen-bar">
              <i />
              <i />
              <i />
            </div>
            <div className="screen-land">
              <i className="moon" />
              <i className="hill back" />
              <i className="hill front" />
              <span className="play-mark">
                <ArrowRight size={22} fill="currentColor" />
              </span>
            </div>
            <div className="screen-controls">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="float-tag tag-a">
            <Heart size={14} fill="currentColor" /> your people
          </div>
          <div className="float-tag tag-b">
            <Radio size={14} /> connected
          </div>
          <span className="star s-a">✳</span>
          <span className="star s-b">✦</span>
        </div>
      </section>
      <div className="trust-strip">
        <div className="wrap">
          <b>MADE FOR YOUR INNER CIRCLE</b>
          <span>
            <UsersRound size={15} /> Two people
          </span>
          <i />
          <span>
            <ShieldCheck size={15} /> Password protected
          </span>
          <i />
          <span>
            <Sparkles size={15} /> A shared little ritual
          </span>
        </div>
      </div>
      <section className="feature-grid wrap" id="features">
        <div className="section-head">
          <span className="eyebrow">A MORE CINEMATIC KIND OF CATCH-UP</span>
          <h2>Made for the moments<br />you want to <em>share.</em></h2>
        </div>
        <div className="feature-cards">
          <article><LockKeyhole size={19} /><h3>Private rooms</h3><p>Password-protected rooms, created by the backend.</p><small className="feature-live">AVAILABLE</small></article>
          <article><Radio size={19} /><h3>Direct video</h3><p>Local host video streamed through WebRTC.</p><small className="feature-live">AVAILABLE</small></article>
          <article><UsersRound size={19} /><h3>Room presence</h3><p>See real room participants and connection state.</p><small className="feature-live">AVAILABLE</small></article>
          <article><MessageCircle size={19} /><h3>Chat & reactions</h3><p>Talk and react together in real time over Socket.IO.</p><small className="feature-live">AVAILABLE</small></article>
          <article><Palette size={19} /><h3>Shared themes</h3><p>Set a room atmosphere that stays with your room.</p><small className="feature-live">AVAILABLE</small></article>
          <article><MonitorPlay size={19} /><h3>Playback sync</h3><p>Host playback and seeking synchronize with your guest.</p><small className="feature-live">AVAILABLE</small></article>
        </div>
      </section>
      <section className="how wrap">
        <div className="section-head">
          <span className="eyebrow">A VERY SIMPLE PLAN</span>
          <h2>
            From “what should we watch?”
            <br />
            to <em>“that was lovely.”</em>
          </h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <div>
              <LockKeyhole size={19} />
            </div>
            <h3>Make a private room</h3>
            <p>Choose a password and get your room ID from the server.</p>
          </article>
          <article>
            <span>02</span>
            <div>
              <UsersRound size={19} />
            </div>
            <h3>Bring your person</h3>
            <p>Share the room ID and password so they can join.</p>
          </article>
          <article>
            <span>03</span>
            <div>
              <Clapperboard size={19} />
            </div>
            <h3>Share your movie</h3>
            <p>The host streams a local video directly to the guest.</p>
          </article>
        </div>
        <Link className="underlined" to="/about">
          A little more about the tech <ArrowUpRight size={15} />
        </Link>
      </section>
      <section className="home-cta">
        <div className="wrap">
          <div>
            <span className="eyebrow">YOUR NEXT MOVIE NIGHT</span>
            <h2>
              Bring the popcorn.
              <br />
              <em>We’ll make the room.</em>
            </h2>
          </div>
          <Link
            to={user ? "/rooms/create" : "/register"}
            className="button cream"
          >
            {user ? "Create a room" : "Come on in"} <ArrowRight size={16} />
          </Link>
          <span className="cta-heart">♡</span>
        </div>
      </section>
    </main>
  );
}

function Dashboard() {
  const { user, socket } = useAuth();
  return (
    <main className="dashboard wrap page-enter">
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

function CreateRoom() {
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

function JoinRoom() {
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

function WatchRoom() {
  const { roomId } = useParams();
  const { token, user, socket } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [peerStatus, setPeerStatus] = useState("waiting");
  const [url, setUrl] = useState("");
  const [remoteStream, setRemoteStream] = useState(null);
  const [movie, setMovie] = useState({ name: "", type: "", duration: 0 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [movieBusy, setMovieBusy] = useState(false);
  const [theme, setTheme] = useState("FRIENDSHIP");
  const [themeDraft, setThemeDraft] = useState("FRIENDSHIP");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [themeBusy, setThemeBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [chatError, setChatError] = useState("");
  const [reactionBursts, setReactionBursts] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [fitMode, setFitMode] = useState("fit");
  const [controlsVisible, setControlsVisible] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const peerRef = useRef(null);
  const videoRef = useRef(null);
  const playerFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatPanelRef = useRef(null);
  const reactionsRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatOpenRef = useRef(chatOpen);
  const urlRef = useRef("");
  const streamRef = useRef(null);
  const candidateQueue = useRef([]);
  const remotePlaybackRef = useRef({ currentTime: 0, isPlaying: false, startedAt: 0 });
  const controlsTimerRef = useRef(null);
  const resumeAfterLoadRef = useRef(false);
  const reactionTimersRef = useRef(new Set());
  const hostId = room?.host?._id || room?.host?.id;
  const myId = user?._id || user?.id;
  const isHost = Boolean(hostId && myId && String(hostId) === String(myId));
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);
  useEffect(() => {
    let active = true;
    roomApi
      .get(token, roomId)
      .then(({ room: data }) => {
        if (active) {
          setRoom(data);
          setPeople(data.participants || []);
          setTheme(data.theme || "FRIENDSHIP");
          setMovie(data.movie || { name: "", type: "", duration: 0 });
          setDuration(data.movie?.duration || 0);
          setCurrentTime(data.playback?.currentTime || 0);
          setIsPlaying(Boolean(data.playback?.isPlaying));
          remotePlaybackRef.current = {
            currentTime: data.playback?.currentTime || 0,
            isPlaying: Boolean(data.playback?.isPlaying),
            startedAt: Date.now(),
          };
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, roomId]);
  const closePeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    setRemoteStream(null);
    setPeerStatus("waiting");
    candidateQueue.current = [];
  }, []);
  const makePeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peer.onicecandidate = (event) => {
      if (event.candidate)
        socket?.emit("webrtc:ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
    };
    peer.onconnectionstatechange = () =>
      setPeerStatus(
        {
          connected: "connected",
          connecting: "connecting",
          disconnected: "disconnected",
          failed: "disconnected",
          closed: "disconnected",
        }[peer.connectionState] || "connecting",
      );
    peer.ontrack = (event) => {
      if (event.streams[0]) setRemoteStream(event.streams[0]);
    };
    peerRef.current = peer;
    return peer;
  }, [socket, roomId]);
  const offerToGuest = useCallback(async (nextStream = streamRef.current, forceOffer = false) => {
    try {
      const peer = makePeer();
      const previousStream = streamRef.current;
      let needsNegotiation = false;
      if (nextStream) {
        for (const kind of ["video", "audio"]) {
          const nextTrack = nextStream.getTracks().find((track) => track.kind === kind) || null;
          const sender = peer.getSenders().find((item) => item.track?.kind === kind) || peer.getSenders().find((item) => item.track == null && item.__dishWithUKind === kind);
          if (sender) {
            if (sender.track !== nextTrack) {
              await sender.replaceTrack(nextTrack);
            }
          } else if (nextTrack) {
            const addedSender = peer.addTrack(nextTrack, nextStream);
            addedSender.__dishWithUKind = kind;
            needsNegotiation = true;
          } else {
            const transceiver = peer.addTransceiver(kind, { direction: "sendonly" });
            transceiver.sender.__dishWithUKind = kind;
            needsNegotiation = true;
          }
        }
        streamRef.current = nextStream;
        if (previousStream && previousStream !== nextStream) {
        previousStream.getTracks().forEach((track) => { if (!nextStream.getTracks().includes(track)) track.stop(); });
        }
      }
      if (needsNegotiation || forceOffer) {
        if (peer.signalingState === "have-local-offer") {
          await peer.setLocalDescription({ type: "rollback" });
        }
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket?.emit("webrtc:offer", { roomId, offer });
        setPeerStatus("connecting");
      }
    } catch {
      setMediaError(
        "Could not start video sharing. Reload the room and try again.",
      );
    }
  }, [makePeer, roomId, socket]);
  useEffect(() => {
    if (!room || !socket) return undefined;
    const joined = () => {
      setSocketStatus("connected");
      socket.emit("room:join", { roomId });
    };
    const disconnected = () => {
      setSocketStatus("disconnected");
      closePeer();
    };
    const onJoined = () => {
      setSocketStatus("connected");
    };
    const onJoinedState = (state) => {
      setSocketStatus("connected");
      if (state.theme) setTheme(state.theme);
      if (state.movie) {
        setMovie(state.movie);
        setDuration(state.movie.duration || 0);
      }
      if (Array.isArray(state.participants) && state.participants.some((person) => person.username)) {
        setPeople(state.participants);
      }
      const playback = state.playback;
      if (playback) {
        const currentTime = playback.currentTime || 0;
        setCurrentTime(currentTime);
        setIsPlaying(Boolean(playback.isPlaying));
        remotePlaybackRef.current = {
          currentTime,
          isPlaying: Boolean(playback.isPlaying),
          startedAt: Date.now(),
        };
      }
      socket.emit("chat:history", { roomId });
      if (isHost && streamRef.current) offerToGuest(streamRef.current, true);
    };
    const onRoomError = (data) =>
      setError(data?.message || "Could not enter this room.");
    const onMovieReady = (data) => {
      setMovie({ name: data.name, type: data.type, duration: data.duration || 0 });
      setDuration(data.duration || 0);
      setCurrentTime(0);
      setIsPlaying(false);
      setMovieBusy(false);
    };
    const onMovieError = (data) => {
      setMovieBusy(false);
      setMediaError(data?.message || "The movie could not be prepared.");
    };
    const onChatHistory = (history) => {
      if (Array.isArray(history)) setMessages(history);
    };
    const onChatMessage = (message) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      if (!chatOpenRef.current) setUnreadMessages((count) => count + 1);
    };
    const onReaction = (reaction) => {
      const item = { ...reaction, localId: `${reaction.userId}-${Date.now()}-${Math.random()}` };
      setReactionBursts((current) => [...current.slice(-3), item]);
      const timer = window.setTimeout(() => {
        setReactionBursts((current) => current.filter((entry) => entry.localId !== item.localId));
        reactionTimersRef.current.delete(timer);
      }, 2400);
      reactionTimersRef.current.add(timer);
    };
    const syncGuestPlayback = (time, playing) => {
      if (isHost) return;
      const safeTime = Number.isFinite(time) ? time : remotePlaybackRef.current.currentTime;
      remotePlaybackRef.current = { currentTime: safeTime, isPlaying: playing, startedAt: Date.now() };
      setCurrentTime(safeTime);
      setIsPlaying(playing);
      const video = videoRef.current;
      if (video && Number.isFinite(video.duration)) video.currentTime = safeTime;
      if (playing) video?.play().catch(() => {});
      else video?.pause();
    };
    const onPlaybackPlay = ({ currentTime }) => syncGuestPlayback(currentTime, true);
    const onPlaybackPause = ({ currentTime }) => syncGuestPlayback(currentTime, false);
    const onPlaybackSeek = ({ currentTime }) => {
      if (isHost) return;
      remotePlaybackRef.current = { ...remotePlaybackRef.current, currentTime, startedAt: Date.now() };
      setCurrentTime(currentTime);
      if (videoRef.current && Number.isFinite(videoRef.current.duration)) videoRef.current.currentTime = currentTime;
    };
    const onUserJoined = (person) => {
      setPeople((current) =>
        current.some((entry) => (entry._id || entry.id) === person.userId)
          ? current
          : [...current, { _id: person.userId, username: person.username }],
      );
      if (isHost && streamRef.current) offerToGuest(streamRef.current, true);
    };
    const onUserLeft = ({ userId }) => {
      setPeople((current) =>
        current.filter((entry) => (entry._id || entry.id) !== userId),
      );
      if (userId !== myId) closePeer();
    };
    const onOffer = async ({ offer }) => {
      try {
        const peer = makePeer();
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        for (const candidate of candidateQueue.current)
          await peer.addIceCandidate(candidate);
        candidateQueue.current = [];
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("webrtc:answer", { roomId, answer });
      } catch {
        setMediaError(
          "Could not connect to the host’s stream. Try rejoining the room.",
        );
      }
    };
    const onAnswer = async ({ answer }) => {
      try {
        const peer = peerRef.current;
        if (!peer) return;
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        for (const candidate of candidateQueue.current)
          await peer.addIceCandidate(candidate);
        candidateQueue.current = [];
      } catch {
        setMediaError("The video connection could not be completed.");
      }
    };
    const onCandidate = async ({ candidate }) => {
      try {
        const item = new RTCIceCandidate(candidate);
        if (peerRef.current?.remoteDescription)
          await peerRef.current.addIceCandidate(item);
        else candidateQueue.current.push(item);
      } catch {
        setMediaError("A network connection could not be established.");
      }
    };
    const listeners = [
      ["connect", joined],
      ["disconnect", disconnected],
      ["room:joined", onJoined],
      ["room:joined", onJoinedState],
      ["room:error", onRoomError],
      ["room:user-joined", onUserJoined],
      ["room:user-left", onUserLeft],
      ["room:user-disconnected", onUserLeft],
      ["movie:ready", onMovieReady],
      ["movie:error", onMovieError],
      ["chat:history", onChatHistory],
      ["chat:message", onChatMessage],
      ["reaction:received", onReaction],
      ["playback:play", onPlaybackPlay],
      ["playback:pause", onPlaybackPause],
      ["playback:seek", onPlaybackSeek],
      ["webrtc:offer", onOffer],
      ["webrtc:answer", onAnswer],
      ["webrtc:ice-candidate", onCandidate],
    ];
    listeners.forEach(([event, listener]) => socket.on(event, listener));
    if (socket.connected) socket.emit("room:join", { roomId });
    return () => {
      socket.emit("room:leave");
      listeners.forEach(([event, listener]) => socket.off(event, listener));
      closePeer();
    };
  }, [room, socket, roomId, isHost, myId, closePeer, makePeer, offerToGuest]);
  useEffect(() => {
    if (remoteStream && videoRef.current)
      videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted, url, remoteStream]);
  useEffect(() => {
    if (!url) return undefined;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  useEffect(
    () => () => {
      closePeer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
      reactionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [closePeer],
  );
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);
  useEffect(() => {
    if (isHost || !room) return undefined;
    const interval = window.setInterval(() => {
      roomApi.get(token, roomId).then(({ room: latest }) => {
        if (latest.theme && latest.theme !== theme) setTheme(latest.theme);
      }).catch(() => {});
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isHost, room, roomId, theme, token]);
  useEffect(() => {
    if (isHost || !isPlaying) return undefined;
    const interval = window.setInterval(() => {
      const state = remotePlaybackRef.current;
      setCurrentTime(state.currentTime + Math.max(0, Date.now() - state.startedAt) / 1000);
    }, 300);
    return () => window.clearInterval(interval);
  }, [isHost, isPlaying]);

  const publishCurrentStream = async () => {
    const video = videoRef.current;
    if (!video || typeof video.captureStream !== "function") {
      setMediaError("This browser cannot share local video. Try a current version of Chrome, Edge, or Firefox.");
      return;
    }
    const stream = video.captureStream();
    if (!stream.getTracks().length) {
      setMediaError("The video is still preparing. Try again in a moment.");
      return;
    }
    await offerToGuest(stream);
    setMediaError("");
  };

  const onVideoMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const videoDuration = Number.isFinite(video.duration) ? video.duration : 0;
    setDuration(videoDuration);
    if (!isHost || !selectedFile) return;
    const nextMovie = { name: selectedFile.name, type: selectedFile.type || "video", duration: videoDuration };
    setMovie(nextMovie);
    setMovieBusy(false);
    socket?.emit("movie:ready", { roomId, ...nextMovie });
    publishCurrentStream();
    if (resumeAfterLoadRef.current) {
      resumeAfterLoadRef.current = false;
      video.play().then(() => {
        setIsPlaying(true);
        socket?.emit("playback:play", { roomId, currentTime: 0 });
      }).catch(() => setMediaError("The new movie is ready. Press play to start it."));
    }
  };

  const selectVideo = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi|wmv|mpeg|mpg|3gp)$/i.test(file.name)) {
      setMediaError("Choose a video file supported by your browser.");
      return;
    }
    resumeAfterLoadRef.current = Boolean(isPlaying);
    const previousUrl = urlRef.current;
    videoRef.current?.pause();
    const nextUrl = URL.createObjectURL(file);
    urlRef.current = nextUrl;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    setSelectedFile({ name: file.name, type: file.type || "video", size: file.size });
    setMovieBusy(true);
    setMediaError("");
    setCurrentTime(0);
    setIsPlaying(false);
    setUrl(nextUrl);
  };

  const togglePlayback = async () => {
    if (!isHost || !videoRef.current || !url) return;
    const video = videoRef.current;
    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
        socket?.emit("playback:play", { roomId, currentTime: video.currentTime });
        await publishCurrentStream();
      } catch {
        setMediaError("This video could not be played by your browser.");
      }
    } else {
      video.pause();
      setIsPlaying(false);
      socket?.emit("playback:pause", { roomId, currentTime: video.currentTime });
    }
  };

  const seekTo = (time) => {
    if (!isHost || !videoRef.current || !Number.isFinite(time)) return;
    const nextTime = Math.max(0, Math.min(time, duration || time));
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    socket?.emit("playback:seek", { roomId, currentTime: nextTime });
  };

  const revealControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    if (isPlaying) controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2200);
  };

  const toggleFullscreen = () => {
    setChatOpen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else playerFrameRef.current?.requestFullscreen?.().catch(() => {});
  };

  const sendMessage = (event) => {
    event?.preventDefault();
    const message = messageDraft.trim();
    if (!message || !socket?.connected) {
      if (message && !socket?.connected) setChatError("Reconnecting to the room. Your message wasn’t sent.");
      return;
    }
    socket.emit("chat:message", { roomId, message });
    setMessageDraft("");
    setChatError("");
  };

  const sendReaction = (reaction) => {
    if (socket?.connected) socket.emit("reaction:send", { roomId, reaction });
    else setChatError("Reconnecting to the room. Your reaction wasn’t sent.");
  };

  const updateTheme = async (nextTheme) => {
    if (!isHost) return;
    setThemeBusy(true);
    setError("");
    try {
      const result = await roomApi.updateTheme(token, roomId, nextTheme);
      setTheme(result.theme);
      setRoom((current) => ({ ...current, theme: result.theme }));
      setThemePickerOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setThemeBusy(false);
    }
  };
  const stopLocalMedia = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
  };
  const closeRoom = async () => {
    setBusy(true);
    setError("");
    try {
      await roomApi.close(token, roomId);
      stopLocalMedia();
      closePeer();
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e.message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };
  const leave = () => {
    stopLocalMedia();
    closePeer();
    navigate("/dashboard", { replace: true });
  };
  if (loading)
    return (
      <div className="loader room-loader">
        <Spinner />
        <p>Opening your room</p>
      </div>
    );
  if (!room)
    return (
      <main className="room-missing">
        <Film size={28} />
        <h1>This room isn’t available.</h1>
        <p>{error}</p>
        <Link className="button primary" to="/dashboard">
          Back to your space
        </Link>
      </main>
    );
  return (
    <main className={`watch page-enter ${leftSidebarOpen ? "sidebar-open" : ""} ${chatOpen ? "chat-open" : ""}`} data-theme={theme.toLowerCase()}>
      <div className="portrait-watch-notice" role="status"><RotateCw size={22} /><b>Rotate your phone for the best watch experience</b><span>Your room controls remain available above.</span></div>
      <header className="room-head">
        <div>
          <button className="icon-btn drawer-trigger" onClick={() => setLeftSidebarOpen((open) => !open)} title={leftSidebarOpen ? "Close room navigation" : "Open room navigation"} aria-label={leftSidebarOpen ? "Close room navigation" : "Open room navigation"} aria-expanded={leftSidebarOpen}><PanelLeft size={16} /></button>
          <Link to="/dashboard" className="brand-icon">
            <Heart size={15} fill="currentColor" />
          </Link>
          <span>
            ROOM <b>{room.roomId}</b>
          </span>
          <button
            className="icon-btn"
            aria-label="Copy room ID"
            onClick={() => navigator.clipboard.writeText(room.roomId)}
          >
            <Copy size={14} />
          </button>
        </div>
        <div>
          <span className={`socket-state ${socketStatus}`}>
            <i />
            {socketStatus === "connected"
              ? "Connected"
              : socketStatus === "disconnected"
                ? "Reconnecting"
                : "Connecting"}
          </span>
          <span className={`peer-state ${peerStatus}`} title={peerStatus === "connected" ? "Peer video connected" : peerStatus === "connecting" ? "Connecting video" : peerStatus === "disconnected" ? "Peer video disconnected" : "Waiting for host video"}><i />{peerStatus === "connected" ? "Video ready" : peerStatus === "connecting" ? "Video connecting" : peerStatus === "disconnected" ? "Video offline" : "Waiting video"}</span>
          <span className="people-count">
            <UsersRound size={14} />
            {people.length}/{room.maxParticipants}
          </span>
          <button className={`icon-btn chat-trigger ${chatOpen ? "active" : ""}`} onClick={() => { setChatOpen((open) => !open); setUnreadMessages(0); }} title={chatOpen ? "Close chat" : "Open chat"} aria-label={chatOpen ? "Close chat" : "Open chat"} aria-expanded={chatOpen}>
            {chatOpen ? <X size={15} /> : <MessageCircle size={15} />}
            <span>{chatOpen ? "Close Chat" : "Chat"}</span>
            {unreadMessages > 0 && !chatOpen && <i className="unread-badge">{unreadMessages > 9 ? "9+" : unreadMessages}</i>}
          </button>
          {isHost && <button className="icon-btn room-theme-trigger" onClick={() => { setThemeDraft(theme); setThemePickerOpen(true); }} title="Change room theme" aria-label="Change room theme"><Palette size={15} /></button>}
          <button
            className="icon-btn"
            onClick={leave}
            title="Leave room"
            aria-label="Leave room"
          >
            <LogOut size={15} />
          </button>
          {isHost && (
            <button className="close-room" onClick={() => setConfirm(true)}>
              <X size={14} /> Close room
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="room-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
      <aside className={`room-rail ${leftSidebarOpen ? "open" : ""}`} aria-hidden={!leftSidebarOpen} inert={!leftSidebarOpen}>
        <div className="rail-head"><Link to="/dashboard" className="rail-brand"><span className="brand-icon"><Heart size={15} fill="currentColor" /></span><b>DishWithU</b></Link><button className="icon-btn" onClick={() => setLeftSidebarOpen(false)} title="Close navigation" aria-label="Close navigation"><X size={16} /></button></div>
        <div className="rail-summary"><span>ROOM</span><b>{room.roomId}</b><small><i className={socketStatus === "connected" ? "live-dot" : "wait-dot"} /> {people.length}/{room.maxParticipants} members</small><small className="room-theme-label"><Palette size={12} /> {theme}</small></div>
        <span className="rail-label">YOUR ROOM</span>
        <button className="rail-item active" onClick={() => playerFrameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}><Film size={15} /> Movie player</button>
        <button className="rail-item" onClick={() => { setChatOpen(true); setUnreadMessages(0); }}><MessageCircle size={15} /> Chat {unreadMessages > 0 && <small className="rail-unread">{unreadMessages}</small>}</button>
        <button className="rail-item" onClick={() => reactionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}><Smile size={15} /> Reactions</button>
        <button className="rail-item" onClick={() => { setThemeDraft(theme); setThemePickerOpen(true); }} disabled={!isHost} title={isHost ? "Choose the room theme" : `Host selected ${theme}`}><Palette size={15} /> Theme {isHost && <ArrowRight size={12} />}</button>
        <button className="rail-item disabled" disabled title="No room settings are exposed by this backend"><Settings size={15} /> Room settings</button>
        <button className="rail-leave" onClick={leave}><LogOut size={14} /> Leave room</button>
      </aside>
      <section className="watch-grid">
        <div className="player">
          <div className="player-heading">
            <div>
              <span className="eyebrow">A LITTLE BIG SCREEN</span>
              <h1>{movie.name || (isHost ? "Choose tonight’s movie" : "Waiting for your host")}</h1>
              {movie.name && <small className="movie-subtitle">{movie.type || "Video"} {duration ? `· ${formatTime(duration)}` : ""}</small>}
            </div>
            {isHost ? <button className="button change-movie" onClick={() => fileInputRef.current?.click()}><Film size={15} /> {movie.name ? "Change Movie" : "Choose Movie"}</button> : <span className="private-tag"><LockKeyhole size={12} /> HOST CONTROLS PLAYBACK</span>}
          </div>
          <input ref={fileInputRef} className="movie-file-input" type="file" accept="video/*" onChange={selectVideo} />
          <div className={`video-box fit-${fitMode} ${controlsVisible ? "controls-visible" : "controls-idle"}`} ref={playerFrameRef} onMouseMove={revealControls} onMouseLeave={() => { if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current); if (isPlaying) setControlsVisible(false); }}>
            {url || remoteStream ? (
              <video
                ref={videoRef}
                src={isHost ? url : undefined}
                controls={false}
                autoPlay={!isHost}
                playsInline
                preload="metadata"
                onLoadedMetadata={onVideoMetadata}
                onTimeUpdate={(event) => { if (isHost && !seeking) setCurrentTime(event.currentTarget.currentTime); }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => { if (isHost) socket?.emit("playback:pause", { roomId, currentTime: videoRef.current?.currentTime || 0 }); }}
              />
            ) : (
              <div className="video-empty">
                <span>
                  <Film size={26} />
                </span>
                <h2>
                  {isHost
                    ? "Your screen, your story."
                    : "The host’s movie will appear here."}
                </h2>
                <p>
                  {isHost
                    ? "Choose a video stored on this device to share it privately."
                    : movie.name ? `Connecting to ${movie.name}...` : "Your host is choosing a movie..."}
                </p>
                {isHost && <button className="button cream upload" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Choose Movie</button>}
              </div>
            )}
            {movieBusy && <div className="movie-preparing"><Spinner /> Preparing local movie...</div>}
            {reactionBursts.length > 0 && <div className="reaction-floats" aria-live="polite">{reactionBursts.map((item) => <span className="reaction-float" key={item.localId}>{item.reaction}</span>)}</div>}
            {(url || remoteStream) && <div className={`movie-controls ${controlsVisible ? "shown" : "faded"}`} onMouseEnter={() => setControlsVisible(true)}>
              <input className="seek-slider" aria-label="Seek movie" title={isHost ? "Drag to seek" : "Playback is controlled by the host"} type="range" min="0" max={Math.max(duration, 1)} step="0.1" value={Math.min(currentTime, duration || currentTime)} disabled={!isHost || !duration} onPointerDown={() => setSeeking(true)} onChange={(event) => { setSeeking(true); setCurrentTime(Number(event.target.value)); }} onPointerUp={(event) => { seekTo(Number(event.currentTarget.value)); setSeeking(false); }} onPointerCancel={() => setSeeking(false)} onBlur={(event) => { if (seeking) { seekTo(Number(event.currentTarget.value)); setSeeking(false); } }} onKeyUp={(event) => { seekTo(Number(event.currentTarget.value)); setSeeking(false); }} style={{ "--seek-progress": `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%` }} />
              <div className="control-row">
                <button className="player-control" onClick={togglePlayback} disabled={!isHost || !url || movieBusy} title={isPlaying ? "Pause movie" : "Play movie"} aria-label={isPlaying ? "Pause movie" : "Play movie"}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
                <button className="player-control skip-control" onClick={() => seekTo(currentTime - 10)} disabled={!isHost || !url || !duration} title="Back 10 seconds" aria-label="Back 10 seconds"><SkipBack size={17} /><small>10</small></button>
                <button className="player-control skip-control" onClick={() => seekTo(currentTime + 10)} disabled={!isHost || !url || !duration} title="Forward 10 seconds" aria-label="Forward 10 seconds"><SkipForward size={17} /><small>10</small></button>
                <span className="time-readout">{formatTime(currentTime)} <i>/</i> {formatTime(duration)}</span>
                <span className="playback-indicator"><i /> {isHost ? "HOST" : "SYNCED"}</span>
                <button className="player-control volume-toggle" onClick={() => setIsMuted((value) => !value)} title={isMuted ? "Unmute" : "Mute"} aria-label={isMuted ? "Unmute" : "Mute"}>{isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
                <input className="volume-slider" aria-label="Volume" type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setIsMuted(false); }} />
                <button className={`player-control fit-toggle ${fitMode === "fit" ? "selected" : ""}`} onClick={() => setFitMode((mode) => mode === "fit" ? "fill" : "fit")} title="Fit video" aria-label={`Fit video: ${fitMode === "fit" ? "Fit" : "Fill"}`} aria-pressed={fitMode === "fit"}>{fitMode === "fit" ? "Fit ✓" : "Fill"}</button>
                <button className="player-control" onClick={toggleFullscreen} title="Full screen" aria-label="Full screen"><Maximize size={17} /></button>
              </div>
              {!isHost && <span className="guest-control-note">Playback is controlled by the host</span>}
            </div>}
          </div>
          {selectedFile && isHost && <div className="movie-file-info"><span><Film size={14} /><b>{selectedFile.name}</b></span><small>{selectedFile.type || "Video file"}{selectedFile.size ? ` · ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : ""} · Local only</small>{movieBusy && <span className="preparing-label"><Spinner /> Preparing</span>}</div>}
          <ErrorText>{mediaError}</ErrorText>
          <div className="privacy-note">
            <ShieldCheck size={16} />
            <span>
              <b>Your video stays yours.</b> Streamed peer-to-peer from this
              device, never sent to the server.
            </span>
            <Sparkles size={15} />
          </div>
          <section className="reaction-strip" ref={reactionsRef} aria-label={`${theme} reactions`}>
            <div><b>React to the moment</b><small>Reactions appear for everyone watching</small></div>
            <div className="reaction-picker">
              {THEME_REACTIONS[theme]?.map((reaction, index) => <button key={`${theme}-${index}`} className="reaction-button" onClick={() => sendReaction(reaction)} title={`Send ${reaction}`} aria-label={`Send ${reaction}`}>{reaction}</button>)}
            </div>
          </section>
        </div>
      </section>
      <aside className={`room-side ${chatOpen ? "open" : ""}`} aria-hidden={!chatOpen} inert={!chatOpen}>
        <section className="chat-panel" ref={chatPanelRef}>
            <div className="chat-panel-head"><div><span className="eyebrow">YOUR WATCH PARTY</span><h2>Room chat</h2></div><span className="chat-live"><i className={socketStatus === "connected" ? "live-dot" : "wait-dot"} /> {socketStatus === "connected" ? "Live" : "Reconnecting"}</span><button className="icon-btn" onClick={() => setChatOpen(false)} title="Close chat" aria-label="Close chat"><X size={16} /></button></div>
            <div className="chat-messages" aria-live="polite">
              {messages.length === 0 ? <div className="chat-empty"><span className="chat-empty-icon"><Heart size={18} /></span><b>No messages yet</b><p>Send the first note while your movie gets ready.</p></div> : messages.map((message) => {
                const own = String(message.userId) === String(myId);
                return <article className={`chat-message ${own ? "own" : ""}`} key={message.id}><span className="chat-avatar" aria-label={message.username || "Participant"}>{message.username?.trim()?.slice(0, 1)?.toUpperCase() || <UserRound size={13} />}</span><div className="chat-message-body"><p>{message.message}</p></div></article>;
              })}
              <div ref={chatEndRef} />
            </div>
            {chatError && <p className="chat-error" role="alert">{chatError}</p>}
            <form className="chat-composer" onSubmit={sendMessage}><input aria-label="Write a message" maxLength={500} value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) sendMessage(event); }} placeholder="Type a message..." disabled={!socket?.connected} /><button className="send-message" type="submit" disabled={!socket?.connected || !messageDraft.trim()} aria-label="Send message" title="Send message"><Send size={15} /></button></form>
        </section>
      </aside>
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-title"
          >
            <button
              className="icon-btn modal-x"
              onClick={() => setConfirm(false)}
              aria-label="Cancel"
            >
              <X size={16} />
            </button>
            <span className="modal-symbol">
              <LockKeyhole size={19} />
            </span>
            <h2 id="close-title">Close this room?</h2>
            <p>This ends the room for everyone in it.</p>
            <ErrorText>{error}</ErrorText>
            <div>
              <button
                className="button quiet"
                onClick={() => setConfirm(false)}
                disabled={busy}
              >
                Keep room open
              </button>
              <button
                className="button danger"
                onClick={closeRoom}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Spinner /> Closing room...
                  </>
                ) : (
                  "Close room"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
      {themePickerOpen && isHost && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setThemePickerOpen(false); }}>
          <section className="modal theme-modal" role="dialog" aria-modal="true" aria-labelledby="theme-title">
            <button className="icon-btn modal-x" onClick={() => setThemePickerOpen(false)} aria-label="Close theme picker"><X size={16} /></button>
            <span className="modal-symbol"><Palette size={19} /></span>
            <h2 id="theme-title">Set your room’s mood</h2>
            <p>Choose the atmosphere for this movie night. Your selection is saved to the room.</p>
            <div className="theme-options">
              {ROOM_THEMES.map(({ id, label, detail, icon: ThemeIcon }) => (
                <button key={id} className={`theme-option theme-${id.toLowerCase()} ${themeDraft === id ? "selected" : ""}`} onClick={() => setThemeDraft(id)} aria-pressed={themeDraft === id}>
                  <ThemeIcon size={18} /><span><b>{label}</b><small>{detail}</small></span>{themeDraft === id && <Check size={16} />}
                </button>
              ))}
            </div>
            <ErrorText>{error}</ErrorText>
            <div className="theme-actions">
              <button className="button quiet" onClick={() => setThemePickerOpen(false)} disabled={themeBusy}>Cancel</button>
              <button className="button primary" onClick={() => updateTheme(themeDraft)} disabled={themeBusy || themeDraft === theme}>{themeBusy ? <><Spinner /> Saving...</> : <>Save theme <Check size={15} /></>}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function About() {
  const steps = [
    ["01", "Create a room", "The backend generates your private room ID."],
    ["02", "Share the invite", "Send your guest the ID and chosen password."],
    [
      "03",
      "Select local video",
      "The host chooses a file on their own device.",
    ],
    ["04", "Connect and watch", "WebRTC streams media between browsers."],
  ];
  return (
    <main className="about wrap page-enter">
      <section className="about-hero">
        <span className="eyebrow">
          <Heart size={13} /> A NOTE ABOUT DISH WITH U
        </span>
        <h1>
          Distance is real.
          <br />
          <em>Movie night can be, too.</em>
        </h1>
        <p>
          A private watch-room project for friends, couples, and families who
          want to share a locally stored video, wherever they happen to be.
        </p>
      </section>
      <section className="about-how">
        <span className="eyebrow">THE SHORT VERSION</span>
        <h2>
          Four little steps.
          <br />
          <em>One shared screen.</em>
        </h2>
        <div className="about-steps">
          {steps.map(([n, title, text]) => (
            <article key={n}>
              <b>{n}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="about-tech">
        <div>
          <span className="eyebrow">THE IMPORTANT PART</span>
          <h2>
            Your movie never
            <br />
            <em>leaves your device.</em>
          </h2>
          <p>
            The host’s browser captures the selected video and sends it
            peer-to-peer using WebRTC. The file is not uploaded, stored by the
            backend, or sent through Express.
          </p>
          <p>
            Socket.IO handles authenticated room membership, real-time chat,
            reactions, playback synchronization, and WebRTC signaling. Room
            themes are stored with the room and selected by its host.
          </p>
        </div>
        <div className="fact-list">
          <article>
            <LockKeyhole size={17} />
            <span>
              <b>Private rooms</b>
              <small>Room entry requires the host’s password.</small>
            </span>
            <Check size={15} />
          </article>
          <article>
            <Radio size={17} />
            <span>
              <b>WebRTC media</b>
              <small>The video stream stays between browsers.</small>
            </span>
            <Check size={15} />
          </article>
          <article>
            <MonitorPlay size={17} />
            <span>
              <b>Host-selected movie</b>
              <small>Local video only; never uploaded.</small>
            </span>
            <Check size={15} />
          </article>
          <article>
            <UsersRound size={17} />
            <span>
              <b>Room for two</b>
              <small>That’s the current backend limit.</small>
            </span>
            <Check size={15} />
          </article>
        </div>
      </section>
      <section className="tips">
        <div>
          <span className="eyebrow">A FEW HELPFUL NOTES</span>
          <h2>
            Set yourselves up
            <br />
            <em>for a good night.</em>
          </h2>
        </div>
        <ul>
          <li>
            <Check size={15} /> A stable internet connection helps WebRTC
            connect.
          </li>
          <li>
            <Check size={15} /> Choose a video format supported by your browser.
          </li>
          <li>
            <Check size={15} /> Keep the room tab open while watching.
          </li>
          <li>
            <Check size={15} /> Headphones help avoid audio feedback.
          </li>
          <li>
            <Check size={15} /> Use a current version of Chrome, Edge, or
            Firefox.
          </li>
        </ul>
      </section>
      <div className="about-end">
        <Sparkles size={18} />
        <p>
          A little less distance. A little more <em>together.</em>
        </p>
        <Link to="/register">
          Make an account <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}

function Profile() {
  const { user } = useAuth();
  return (
    <main className="profile-page wrap page-enter">
      <span className="eyebrow">
        <Heart size={13} /> YOUR ACCOUNT
      </span>
      <h1>Your profile.</h1>
      <section>
        <span>{user?.username?.slice(0, 1)?.toUpperCase()}</span>
        <div>
          <small>USERNAME</small>
          <b>{user?.username}</b>
        </div>
        <div>
          <small>EMAIL ADDRESS</small>
          <p>{user?.email}</p>
        </div>
      </section>
      <Link className="underlined" to="/dashboard">
        <ArrowLeft size={14} /> Back to your space
      </Link>
    </main>
  );
}

function RoutesView() {
  return (
    <Frame>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/rooms/create"
          element={
            <Protected>
              <CreateRoom />
            </Protected>
          }
        />
        <Route
          path="/rooms/join"
          element={
            <Protected>
              <JoinRoom />
            </Protected>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <Protected>
              <WatchRoom />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Frame>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesView />
      </AuthProvider>
    </BrowserRouter>
  );
}
