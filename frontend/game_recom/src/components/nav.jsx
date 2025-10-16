import "./nav.css";
import logo from "../assets/testlogo.png";
import { useNavigate } from "react-router";

export default function Nav() {
  const navigate = useNavigate();
  const handleLogOut = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  return (
    <nav className="gw-nav">
      <div className="gw-left">
        <img src={logo} alt="GameWorks logo" className="gw-logo-img" />
        <div className="gw-title">GameWorks</div>
        <div className="gw-left-links">
          <ul className="gw-left-menu"></ul>
        </div>
      </div>

      <div className="gw-center">
        <form className="gw-search-form" onSubmit={(e) => e.preventDefault()}>
          <input className="gw-search" placeholder="Search games, genres..." />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      <div className="gw-right">
        <button className="btn btn-danger" onClick={handleLogOut}>
          Logout
        </button>
      </div>
    </nav>
  );
}
