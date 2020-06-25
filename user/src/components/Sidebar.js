import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

import { LogoutOutlined } from "@ant-design/icons";

const Sidebar = () => {
  return (
    <div className="sidebar-wrapper">
      <Link to="/">
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </Link>
      <div className="sidebar-content">
        <div>
          <h5 className="main-wallet-text"> MAIN WALLLET </h5>
          <h1 className="wallet-balance">48.6</h1> <p className="wallet-balance2"> Mi </p>
        </div>
        <button className="custom-button" onClick={() => console.log("Add funds")}>
          Add funds
        </button>
        <Link to="/wallet" className="cta">
          Withdraw
        </Link>
      </div>
      <div className="sidebar-footer">
        <Link style={{ fontSize: "15px", color: "#aab8c2" }} to="/">
          <LogoutOutlined rotate={180} style={{ fontSize: "15px", color: "#aab8c2" }} /> Logout
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
