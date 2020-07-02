import React, { useContext, useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { AppContext } from "../context/globalState";
import { resetPassword } from "../utils/firebase";

import { Form, Input, Alert } from "antd";

import CustomAuthHeader from "../components/CustomAuthHeader";

const ForgotPassword = ({ history }) => {
  const { isLoggedIn, setLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [error, setErrors] = useState("");
  const pathname = history.location.pathname;

  useEffect(() => {
    isLoggedIn && history.push("/overview");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const callback = (result) => {
    setLoggedIn(false);
    result && history.push("/");
  };

  // const handleForm = (e) => {
  //   e.preventDefault();
  //   resetPassword(email, callback, setErrors);
  // };

  // const resetConfirmation = (value) => {
  //   <Alert message={`We have sent a reset password email to ${value}`} type="success" showIcon />;
  // };

  const onFinish = () => {
    resetPassword(email, callback, setErrors);
  };

  return (
    <div className="login-main-section">
      <CustomAuthHeader pathname={pathname} />
      <div className="login-content">
        <h5> Forgot Password </h5> <br />
        <br />
        <Form size="large" layout="vertical" name="forgot-password-form" hideRequiredMark onFinish={onFinish}>
          <Form.Item
            name={["email"]}
            label="Email address"
            hasFeedback
            onChange={(e) => setEmail(e.target.value)}
            rules={[
              {
                required: true,
                message: "Please enter your Email!",
              },
            ]}
          >
            <Input className="rounded-input" placeholder="email" />
          </Form.Item>
          <br />
          <button className="reset-password-btn" type="submit">
            Reset Password
          </button>
          <br />
          <span>{error}</span>
        </Form>
      </div>
    </div>
  );
};

export default withRouter(ForgotPassword);
