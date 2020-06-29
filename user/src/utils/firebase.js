import * as firebase from "firebase/app";
import "firebase/auth";
import firebaseConfig from "../firebase.config";

!firebase.apps.length && firebase.initializeApp(firebaseConfig);
firebase.auth().useDeviceLanguage();

const auth = firebase.auth();

const signInWithCredentials = (action, email, password, callback, errorCallback) => {
  auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => {
      auth[`${action}WithEmailAndPassword`](email, password)
        .then(res => res.user && callback(!!res.user))
        .catch(error => errorCallback(error.message));
    });
};

async function logout(callback) {
  auth.signOut()
    .then(callback)
    .catch(error => console.error("An error happened", error));
}

const signInWithGoogle = (callback, errorCallback) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  // provider.addScope('https://www.googleapis.com/auth/documents');
  // provider.addScope('https://www.googleapis.com/auth/drive');
  firebase
    .auth()
    .setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => 
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(result => callback(!!result))
        .catch(error => errorCallback(error.message))
    );
};

const resetPassword = (email, callback, errorCallback) => {
  auth.sendPasswordResetEmail(email)
    .then(result => callback(!!result))
    .catch(error => errorCallback(error.message));
};

export {
  auth,
  logout,
  resetPassword,
  signInWithGoogle,
  signInWithCredentials
};
