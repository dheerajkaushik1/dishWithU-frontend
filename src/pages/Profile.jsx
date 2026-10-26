import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { useAuth } from "../context/useAuth";
export default function Profile() {
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
