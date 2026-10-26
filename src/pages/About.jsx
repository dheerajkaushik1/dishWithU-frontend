import { Link } from "react-router-dom";
import { ArrowRight, Check, Heart, LockKeyhole, MonitorPlay, Radio, Sparkles, UsersRound } from "lucide-react";
export default function About() {
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
