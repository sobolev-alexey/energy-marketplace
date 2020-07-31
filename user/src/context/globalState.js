import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import firebaseConfig from "../firebase.config";
import callApi from '../utils/callApi';

export const AppContext = React.createContext({});

const GlobalState = ({ children }) => {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const [device, setDevice] = useState({});

  async function readSession() {
    const user = await window.sessionStorage.getItem(
      `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`
    );
    if (user) {
      setLoggedIn(true);
    }
  };
    
  useEffect(() => {
    readSession();
    auth.onAuthStateChanged(async firebaseUser => {
      setLoggedIn(!!firebaseUser);
      if (!!firebaseUser) {
        setUser({ userId: firebaseUser?.uid });
        const existingUser = await localStorage.getItem("user");
        setUser({ userId: firebaseUser?.uid, ...JSON.parse(existingUser) });
        
        if (!existingUser) {
          setUser({ userId: firebaseUser?.uid });
          await localStorage.setItem("user", JSON.stringify({ userId: user?.uid }));
        }
      } else {
        await localStorage.clear();
        setUser({});
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateUser = async () => {
    try {
      const response = await callApi('user', { userId: user?.userId });
      if (!response?.error && response?.status !== 'error') {
        setUser({ ...response, userId: user?.userId });
        await localStorage.setItem("user", JSON.stringify({ ...response, userId: user?.userId }));
      } else {
        console.log('Balance error', response?.error);
      }
    } catch (err) {
      console.error('Error while getting wallet balance', err);
    }
  }

  return (
    <AppContext.Provider value={{ 
      isLoggedIn, setLoggedIn,
      user, setUser,
      device, setDevice,
      updateUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default GlobalState;
