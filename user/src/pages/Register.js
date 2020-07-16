import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { AppContext } from "../context/globalState";
import { signInWithGoogle, signInWithCredentials } from "../utils/firebase";

import { Form, Input, Space } from "antd";

import CustomAuthHeader from "../components/CustomAuthHeader";
import googleLogo from "../assets/google-logo.svg";

const Register = () => {
  let history = useHistory();
  const { isLoggedIn, setLoggedIn } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
          validateTrigger="onSubmit"
        >
          <Form.Item
            name={["email"]}
            label="Email address"
            hasFeedback
            onChange={(e) => setRevealFields(true) || setEmail(e.target.value)}
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
          <div className={revealFields ? "reveal-fields" : "hide-fields"}>
            <Form.Item
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
                  message: "Please provide your password!",
                },
              ]}
            >
              <Input.Password className="rounded-input" />
            </Form.Item>
            <Form.Item
              name={["confirm"]}
              label="Confirm Password"
              dependencies={["password"]}
              hasFeedback
              onChange={(e) => setConfirm(e.target.value)}
              rules={[
                {
                  required: true,
                  message: "Please provide your password!",
                },
                { 
                  validator: (_, value) => 
                    (!value || (value.length > 7 && value.length < 33)) 
                    ? Promise.resolve() 
                    : Promise.reject(`Password must be between ${8} and ${32} characters`) 
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject("The two passwords that you entered do not match!");
                  },
                }),
              ]}
            >
              <Input.Password className="rounded-input" />
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
          <span className="error-message"> {error} </span>
        </Form>
      </div>
    </div>
  );
};

export default Register;
