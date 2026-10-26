import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Spinner from "../components/common/Spinner";
export default function ProtectedRoute({ children }) {
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
