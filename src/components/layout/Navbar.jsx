import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Heart, LogOut, Menu, UserRound, X } from "lucide-react";
import { useAuth } from "../../context/useAuth";

function Navbar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  return (
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
  );
}

export default Navbar;
