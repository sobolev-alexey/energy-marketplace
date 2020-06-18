import firebase from 'firebase/app';
import 'firebase/auth';
import firebaseConfig from '../firebase.config';

!firebase.apps.length && firebase.initializeApp(firebaseConfig);
firebase.auth().useDeviceLanguage();

const auth = firebase.auth();

const signInWithCredentials = (action, email, password, callback, errorCallback) => {
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => {
            auth[`${action}WithEmailAndPassword`](email, password)
                .then(res => res.user && callback(!!res.user))
                .catch(e => errorCallback(e.message));
        });
}

async function logout(callback) {
    auth.signOut()
        .then(() => callback)
        .catch(error => console.error('An error happened', error));
}

const signInWithGoogle = (callback, errorCallback) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => 
            firebase
                .auth()
                .signInWithPopup(provider)
                .then(result => callback(!!result))
                .catch(e => errorCallback(e.message))
        )
}

export {
    auth,
    logout,
    signInWithGoogle,
    signInWithCredentials
}
