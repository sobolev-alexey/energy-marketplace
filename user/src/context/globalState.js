import React, { useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import firebaseConfig from "../firebase.config";

export const AppContext = React.createContext({});

const GlobalState = ({ children }) => {
    const [isLoggedIn, setLoggedIn] = useState(false);

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
        auth.onAuthStateChanged(user => {
            setLoggedIn(!!user);
        })
    }, []);

    return (
        <AppContext.Provider value={{ isLoggedIn, setLoggedIn }}>
            {children}
        </AppContext.Provider>
    );
};

export default GlobalState;
