import React, { useContext, useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { AppContext } from "../context/globalState";
import { resetPassword } from "../utils/firebase";
// import { Form } from 'antd';

const ForgotPassword = ({ history }) => {
  const { isLoggedIn, setLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [error, setErrors] = useState("");
  
  useEffect(() => {
    isLoggedIn && history.push("/overview");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const callback = result => {
    setLoggedIn(false);
    result && history.push("/");
  };

  const handleForm = e => {
    e.preventDefault();
    resetPassword(email, callback, setErrors);
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <form onSubmit={e => handleForm(e)}>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          name="email"
          type="email"
          placeholder="email"
        />
        <hr />
        <button type="submit">Reset password</button>
        <span>{error}</span>
      </form>
    </div>
  );
};
  
export default withRouter(ForgotPassword);