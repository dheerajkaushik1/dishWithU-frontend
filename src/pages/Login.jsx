import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { authApi } from "../services/authApi";
import { useAuth } from "../context/useAuth";
import AuthLayout from "../components/common/AuthLayout";
import ErrorText from "../components/common/ErrorText";
import Spinner from "../components/common/Spinner";
export default function Login() {
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
