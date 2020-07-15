import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { AppContext } from "../context/globalState";
import { resetPassword } from "../utils/firebase";

import { Form, Input, Modal } from "antd";

import CustomAuthHeader from "../components/CustomAuthHeader";

const ForgotPassword = () => {
  let history = useHistory();
  const [modal, contextHolder] = Modal.useModal();
  const { isLoggedIn, setLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [error, setErrors] = useState("");
  const pathname = history.location.pathname;

  useEffect(() => {
    isLoggedIn && history.push("/overview");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const callback = () => {
    const config = {
      title: "Password reset",
      content: (
        <div>
          <p>We have sent a reset password email to your email</p>
        </div>
      ),
      onOk: () => {
        setLoggedIn(false);
        history.push("/");
      }
    };
    modal.info(config);
  };

  const onFinish = () => {
    resetPassword(email, callback, setErrors);
  };

  return (
    <div className="login-main-section">
      <CustomAuthHeader pathname={pathname} />
      <div className="login-content">
        <h5> Forgot Password </h5> <br />
        <br />
        <Form 
          size="large" 
          layout="vertical" 
          name="forgot-password-form" 
          hideRequiredMark 
          onFinish={onFinish} 
          validateTrigger="onSubmit"
        >
          <Form.Item
            name={["email"]}
            label="Email address"
            hasFeedback
            onChange={(e) => setEmail(e.target.value)}
            rules={[
              {
                type: "email",
                message: "This is not a valid email!",
              },
              {
                required: true,
                message: "Please provide your email!",
              },
            ]}
          >
            <Input className="rounded-input" />
          </Form.Item>
          <br />
          <button className="reset-password-btn" type="submit">
            Reset Password
          </button>
          <br />
          <span>{error}</span>
        </Form>
        {contextHolder}
      </div>
    </div>
  );
};

export default ForgotPassword;
