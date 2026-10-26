import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { authApi } from "../services/authApi";
import { useAuth } from "../context/useAuth";
import AuthLayout from "../components/common/AuthLayout";
import ErrorText from "../components/common/ErrorText";
import Spinner from "../components/common/Spinner";
export default function Register() {
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
