import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Clapperboard, Heart, LockKeyhole, MessageCircle, MonitorPlay, Palette, Radio, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useAuth } from "../context/useAuth";
export default function Home() {
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
