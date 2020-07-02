import React from "react";
import { Link } from "react-router-dom";

import logo from "../assets/logo.svg";

const LoginHeader = () => {
  return (
    <div className="login-header-wrapper">
      <Link to="/">
        <img src={logo} alt="Logo" className="login-logo" />
      </Link>
      <Link className="login-btn" to="/register">
        Register
      </Link>
    </div>
  );
};

export default LoginHeader;
