import React from "react";
import { Link } from "react-router-dom";

import logo from "../assets/logo.svg";

const CustomAuthHeader = ({ pathname }) => {
  return (
    <div className="login-header-wrapper">
      <Link to="/">
        <img src={logo} alt="Logo" className="login-logo" />
      </Link>
      {(() => {
        switch (pathname) {
          case "/":
            return (
              <Link className="login-btn" to="/register">
                Register
              </Link>
            );
          case "/forgot":
            return (
              <Link className="login-btn" to="/">
                Log in
              </Link>
            );
          case "/register":
            return (
              <Link className="login-btn" to="/">
                Log in
              </Link>
            );
          default:
            return;
        }
      })()}
    </div>
  );
};

export default CustomAuthHeader;
