import React, { useState, useEffect } from 'react';
import * as firebase from "firebase";
import firebaseConfig from "../firebase.config";

export const AppContext = React.createContext({});

!firebase.apps.length && firebase.initializeApp(firebaseConfig);
firebase.auth().useDeviceLanguage();

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

    async function logOut() {
        firebase.auth().signOut().then(() => {
            console.log('Sign-out successful.')
            setLoggedIn(false);
        }).catch(error => {
            console.error('An error happened.', error)
        });
    }
    
    useEffect(() => {
        readSession();
    }, []);

    return (
        <AppContext.Provider value={{ isLoggedIn, setLoggedIn, logOut }}>
            {children}
        </AppContext.Provider>
    );
};

export default GlobalState;
