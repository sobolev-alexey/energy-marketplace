import React, { useContext, useEffect, useState } from 'react';
import * as firebase from 'firebase'
import { withRouter } from 'react-router-dom';
import { AppContext } from '../context/globalState';
// import { Form } from 'antd';

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
        console.log('Login', isLoggedIn);
        if (isLoggedIn) {
            history.push('/overview');
        };
    }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleForm = e => {
  
      e.preventDefault();
  
      firebase.auth().useDeviceLanguage();
      
      firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => {
          firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(res => {
            if (res.user) {
                setLoggedIn(true);
            };
            history.push('/overview')
          })
          .catch(e => {
            setErrors(e.message);
          });
        })
  
    };
  
    const signInWithGoogle = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(() => {
        firebase
        .auth()
        .signInWithPopup(provider)
        .then(result => {
          console.log('Google login', result)
          setLoggedIn(true)
          history.push('/overview')
        })
        .catch(e => setErrors(e.message))
      })
  
    }
    return (
      <div>
        <h1>Login</h1>
        <form onSubmit={e => handleForm(e)}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            name="email"
            type="email"
            placeholder="email"
          />
          <input
            onChange={e => setPassword(e.target.value)}
            name="password"
            value={password}
            type="password"
            placeholder="password"
          />
          <hr />
          <button onClick={() => signInWithGoogle()} className="googleBtn" type="button">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
              alt="logo"
            />
            Login With Google
          </button>
          <button type="submit">Login</button>
          <span>{error}</span>
        </form>
      </div>
    );
  };
  
  export default withRouter(Login);