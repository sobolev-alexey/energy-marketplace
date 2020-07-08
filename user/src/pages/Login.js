import React, { useContext, useEffect, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { AppContext } from "../context/globalState";
import { signInWithGoogle, signInWithCredentials } from "../utils/firebase";

import { Form, Input, Space } from "antd";

import CustomAuthHeader from "../components/CustomAuthHeader";
import googleLogo from "../assets/google-logo.svg";

const Login = () => {
  let history = useHistory();
  const { isLoggedIn, setLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setErrors] = useState("");
  const pathname = history.location.pathname;

  useEffect(() => {
    isLoggedIn && history.push("/overview");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const callback = async (result) => {
    setLoggedIn(result);
    result && history.push("/overview");
  };

  const handleGoogleLogin = () => {
    signInWithGoogle(callback, setErrors);
  };

  const onFinish = () => {
    signInWithCredentials("signIn", email, password, callback, setErrors);
  };

  return (
    <div className="login-main-section">
      <CustomAuthHeader pathname={pathname} />
      <div className="login-content">
        <h5>Log in</h5>
        <br />
        <br />
        <Form 
          size="large" 
          layout="vertical" 
          name="login-form" 
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
                type: 'email',
                message: 'This is not a valid email!',
              },
              {
                required: true,
                message: 'Please provide your email!',
              },
            ]}
          >
            <Input className="rounded-input" />
          </Form.Item>
          <Form.Item
            className="ant-form-item-mb"
            name={["password"]}
            label="Password"
            hasFeedback
            onChange={(e) => setPassword(e.target.value)}
            rules={[
              { 
                validator: (_, value) => 
                  (!value || (value.length > 7 && value.length < 33)) 
                  ? Promise.resolve() 
                  : Promise.reject(`Password must be between ${8} and ${32} characters`) 
              },
              {
                required: true,
                message: 'Please provide your password!',
              },
            ]}
          >
            <Input.Password className="rounded-input" />
          </Form.Item>
          <Link to="/forgot" className="forgot-link">
            Forgot password?
          </Link>
          <br />
          <Space size={25}>
            <button onClick={() => handleGoogleLogin()} className="google-login-btn" type="button">
              <img className="google-logo" src={googleLogo} alt="logo" />
              Login with Google <span> </span>
            </button>
            <button className="login-btn-inverse" type="submit">
              Login
            </button>
          </Space>
          <br />
          <br />
          <span>{error}</span>
        </Form>
      </div>
    </div>
  );
};

export default Login;
