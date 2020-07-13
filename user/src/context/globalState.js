import React, { useState, useEffect } from "react";
import { auth } from "../utils/firebase";
import firebaseConfig from "../firebase.config";

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
          console.log('Store user');
          setUser({ userId: firebaseUser?.uid });
          await localStorage.setItem("user", JSON.stringify({ userId: user?.uid }));
        }
      } else {
        console.log('Remove user');
        await localStorage.clear();
        setUser({});
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={{ 
      isLoggedIn, setLoggedIn,
      user, setUser,
      device, setDevice
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default GlobalState;
