import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
export default function AuthLayout({ title, subtitle, children, foot }) {
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
