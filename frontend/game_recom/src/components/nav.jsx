import "./nav.css";
import logo from "../assets/testlogo.png";
import { useNavigate, useLocation } from "react-router";

export default function Nav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <nav className="gw-nav">
      <div className="gw-left">
        <img
          src={logo}
          alt="GameWorks logo"
          className="gw-logo-img"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
        <div
          className="gw-title"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          GameWorks
        </div>
        <div className="gw-left-links">
          <ul className="gw-left-menu">
            <li
              className="gw-menu"
              onClick={() => navigate("/")}
              style={{
                fontWeight: location.pathname === "/" ? "700" : "400",
                borderBottom:
                  location.pathname === "/" ? "2px solid #66c0f4" : "none",
              }}
            >
              🏠 Home
            </li>
            <li
              className="gw-menu"
              onClick={() => navigate("/favourites")}
              style={{
                fontWeight: location.pathname === "/favourites" ? "700" : "400",
                borderBottom:
                  location.pathname === "/favourites"
                    ? "2px solid #66c0f4"
                    : "none",
              }}
            >
              ❤️ Favourites
            </li>
          </ul>
        </div>
      </div>

      <div className="gw-right">
        <button className="btn btn-danger" onClick={handleLogOut}>
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
