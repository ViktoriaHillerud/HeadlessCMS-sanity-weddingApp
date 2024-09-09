
import { Link } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  return (
    <div className="header">
      <div className="nav-btns">
        <Link className="navBtn" to={"/"}>Home</Link>
      </div>
      <div className="nav-btns">
        <Link className="navBtn" to={"/greetings"}>Greetings</Link>
      </div>
      <div className="nav-btns">
        <Link className="navBtn" to={"/album"}>Album</Link>
      </div>
    </div>
  );
};

export default Navbar;
