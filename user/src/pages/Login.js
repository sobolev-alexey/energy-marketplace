import React, { useContext, useEffect, useState } from "react";
import { withRouter, Link } from "react-router-dom";
import { AppContext } from "../context/globalState";
import { signInWithGoogle, signInWithCredentials } from "../utils/firebase";

import { Form, Input, Space } from "antd";

import LoginHeader from "../components/LoginHeader";
import googleLogo from "../assets/google-logo.svg";

// export default () => (
//     <div className='login-page-wrapper'>
//         Login page
//     </div>
// );

const Login = ({ history }) => {
  const { isLoggedIn, setLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setErrors] = useState("");

  useEffect(() => {
    isLoggedIn && history.push("/overview");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const callback = async (result) => {
    setLoggedIn(result);
    result && history.push("/overview");
  };

  // const handleForm = (e) => {
  //   e.preventDefault();
  //   signInWithCredentials("signIn", email, password, callback, setErrors);
  // };

  const handleGoogleLogin = () => {
    signInWithGoogle(callback, setErrors);
  };

  const onFinish = () => {
    signInWithCredentials("signIn", email, password, callback, setErrors);
  };

  return (
    <div className="login-main-section">
      <LoginHeader />
      <div className="login-content">
        <h5>Log in</h5>
        <br />
        <br />
        <Form size="large" layout="vertical" name="login-form" hideRequiredMark onFinish={onFinish}>
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
          <Form.Item
            className="ant-form-item-mb"
            name={["password"]}
            label="Password"
            hasFeedback
            onChange={(e) => setPassword(e.target.value)}
            rules={[
              {
                required: true,
                message: "Please enter your Password!",
              },
            ]}
          >
            <Input.Password className="rounded-input" placeholder="password" />
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
          <span>{error} </span>
        </Form>
      </div>
    </div>
  );
};

export default withRouter(Login);
