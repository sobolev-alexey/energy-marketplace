import React, { useContext, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { AppContext } from '../context/globalState';
import { signInWithGoogle, signInWithCredentials } from '../utils/firebase';
// import { Form } from 'antd';

// export default () => (
//     <div className='login-page-wrapper'>
//         Login page
//     </div>
// );

const Login = ({ history }) => {
    const { isLoggedIn, setLoggedIn } = useContext(AppContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setErrors] = useState('');
  
    useEffect(() => {
        isLoggedIn && history.push('/overview');
    }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

    const callback = result => {
      setLoggedIn(result);
      result && history.push('/overview');
    }

    const handleForm = e => {
      e.preventDefault();
      signInWithCredentials('signIn', email, password, callback, setErrors);
    };
  
    const handleGoogleLogin = () => {
      signInWithGoogle(callback, setErrors);
    }

    return (
      <div>
        <h1>Login</h1>
        <form onSubmit={e => handleForm(e)}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            name='email'
            type='email'
            placeholder='email'
          />
          <input
            onChange={e => setPassword(e.target.value)}
            name='password'
            value={password}
            type='password'
            placeholder='password'
          />
          <hr />
          <button onClick={() => handleGoogleLogin()} className='googleBtn' type='button'>
            <img
              src='https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'
              alt='logo'
              width={30}
            />
            Login with Google
          </button>
          <button type='submit'>Login</button>
          <span>{error}</span>
        </form>
      </div>
    );
  };
  
  export default withRouter(Login);