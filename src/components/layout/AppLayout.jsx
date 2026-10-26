import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function AppLayout({ children }) {
  const location = useLocation();
  const roomRoute = location.pathname.startsWith("/room/");
  return (
    <div className={`app-shell ${roomRoute ? "room-shell" : ""}`}>
      <Navbar />
      {children}
      {!roomRoute && <Footer />}
    </div>
  );
}
