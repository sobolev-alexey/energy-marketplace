import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useHistory } from "react-router";
import { LogoutOutlined } from "@ant-design/icons";
import { AppContext } from "../context/globalState";
import { logout } from "../utils/firebase";
import logo from "../assets/logo.svg";
import { Loading } from "../components";

const Sidebar = () => {
  let history = useHistory();
  const { setLoggedIn, user } = useContext(AppContext);

  const callback = async () => {
    setLoggedIn(false);
    await localStorage.clear();
    history.push("/");
  };

  return (
    <div className="sidebar-wrapper">
      <Link to="/">
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </Link>
      {!user?.wallet ? (
          <Loading />
        ) : (
        <div className="sidebar-content">
          <h5 className="main-wallet-text"> MAIN WALLLET </h5>
          <h1 className="wallet-balance">
            { user?.wallet?.balance } <span className="wallet-balance3"> Iota </span>
          </h1>
          <br />
          <button className="custom-button" onClick={() => console.log("Add funds")}>
            Add funds
          </button>
          <Link to="/wallet" className="cta">
            Withdraw
          </Link>
        </div>
      )}
      <div className="sidebar-footer">
        <button className="logout" style={{ fontSize: "15px", color: "#aab8c2" }} onClick={() => logout(callback)}>
          <LogoutOutlined rotate={180} style={{ fontSize: "15px", color: "#aab8c2" }} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
