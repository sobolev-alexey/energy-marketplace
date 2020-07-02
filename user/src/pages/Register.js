import React, { useContext, useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { AppContext } from "../context/globalState";
import { signInWithGoogle, signInWithCredentials } from "../utils/firebase";

import { Form, Input, Space } from "antd";

import CustomAuthHeader from "../components/CustomAuthHeader";
import googleLogo from "../assets/google-logo.svg";

const Register = ({ history }) => {
  const { isLoggedIn, setLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setErrors] = useState("");
  const [revealFields, setRevealFields] = useState(false);
  const pathname = history.location.pathname;

  useEffect(() => {
    isLoggedIn && history.push("/overview");
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const callback = (result) => {
    setLoggedIn(result);
    result && history.push("/overview");
  };

  // const handleForm = (e) => {
  //   e.preventDefault();
  //   signInWithCredentials("createUser", email, password, callback, setErrors);
  // };

  const handleGoogleLogin = () => {
    signInWithGoogle(callback, setErrors);
  };

  const [registerForm] = Form.useForm();

  const onFinish = () => {
    signInWithCredentials("createUser", email, password, callback, setErrors);
  };

  return (
    <div className="login-main-section">
      <CustomAuthHeader pathname={pathname} />
      <div className="login-content">
        <h5> Register </h5> <br />
        <br />
        <Form
          form={registerForm}
          size="large"
          layout="vertical"
          name="register-form"
          hideRequiredMark
          onFinish={onFinish}
        >
          <Form.Item
            name={["name"]}
            label="Name"
            hasFeedback
            onChange={() => setRevealFields(true)}
            rules={[
              {
                required: true,
                message: "Please enter your Name!",
              },
            ]}
          >
            <Input className="rounded-input" placeholder="name" />
          </Form.Item>
          <div className={revealFields ? "reveal-fields" : "hide-fields"}>
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

            <Form.Item
              name={["companyName"]}
              label="Company name"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please enter Company name!",
                },
              ]}
            >
              <Input className="rounded-input" placeholder="company name" />
            </Form.Item>
          </div>
          <br />
          <Space size={25}>
            <button onClick={() => handleGoogleLogin()} className="google-login-btn" type="button">
              <img className="google-logo" src={googleLogo} alt="logo" />
              Register with Google <span> </span>
            </button>
            <button className="login-btn-inverse" type="submit">
              Register
            </button>
          </Space>
          <br />
          <br />
          <span> {error} </span>
        </Form>
      </div>
    </div>
  );
};

export default withRouter(Register);
