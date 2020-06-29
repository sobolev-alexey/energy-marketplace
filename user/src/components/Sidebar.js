import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";
import { AppContext } from "../context/globalState";
import { logout } from "../utils/firebase";
import { destroySession } from "../utils/storage";
import logo from "../assets/logo.svg";

const Sidebar = ({ history }) => {
  const { setLoggedIn } = useContext(AppContext);

  const callback = async () => {
    setLoggedIn(false);
    await destroySession();
    history.push("/");
  };

  return (
    <div className="sidebar-wrapper">
      <Link to="/">
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </Link>

      <div className="sidebar-content">
        <h3>
                    Main wallet
        </h3>
        <h1>
                    48.6 <p>Mi</p>
        </h1>
        <button onClick={() => console.log("Add funds") }>
                    Add funds
        </button>
        <Link to="/wallet" className="cta">
                    Withdraw
        </Link>
      </div>
      <div className="sidebar-footer">
        <button className="logout" onClick={() => logout(callback)}>
                    Logout
        </button>
      </div>
    </div>
  );
};

export default withRouter(Sidebar);
