import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../../context/useAuth";

function Footer() {
  const { user } = useAuth();
  return (
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
  );
}

export default Footer;
