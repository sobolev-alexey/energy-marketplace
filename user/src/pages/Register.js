import React, { useContext, useEffect, useState } from 'react';
import * as firebase from 'firebase'
import { withRouter } from 'react-router-dom';
import { AppContext } from '../context/globalState';

// import { Form } from 'antd';

// export default () => (
//     <div className='register-page-wrapper'>
//         Register page
//     </div>
// );

const Register = ({history}) => {
    const { isLoggedIn, setLoggedIn } = useContext(AppContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setErrors] = useState("");
  
    useEffect(() => {
        console.log('Register', isLoggedIn);
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
          .createUserWithEmailAndPassword(email, password)
          .then(res => {
            console.log(res)
            if (res.user) {
              setLoggedIn(true);
              history.push('/overview')
            }
          })
          .catch(e => {
            setErrors(e.message);
          });
        })
    };
  
    const handleGoogleLogin = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
  
      firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => {
          firebase
          .auth()
          .signInWithPopup(provider)
          .then(result => {
            console.log('Google join', result)
            setLoggedIn(true);
            history.push('/overview')
          })
          .catch(e => setErrors(e.message))
        })
    }
  
    return (
      <div>
        <h1>Register</h1>
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
          <button onClick={() => handleGoogleLogin()} className="googleBtn" type="button">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
              alt="logo"
            />
            Register with Google
          </button>
  
          <button type="submit">Register</button>
  
          <span>{error}</span>
        </form>
      </div>
    );
};
  
export default withRouter(Register);