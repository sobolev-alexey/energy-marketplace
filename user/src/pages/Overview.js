import React, { useEffect } from 'react';
import { Layout, Loading } from '../components';
import callApi from '../utils/callApi';
import { auth } from '../utils/firebase';

const Overview = () => {
    const { response, error, loading } = { response: null, error: null, loading: true };
    useEffect(() => {
        auth.onAuthStateChanged(async user => {
            if (user) {
                // User is signed in.
                console.log('User 1', user.uid);
                const { response, error, loading } = await callApi('user', { userId: user?.uid });
                console.log('User 2', response, error, loading);
            } else {
                // No user is signed in.
                console.log('Oops')
            }
        });

        // async function storeResponse() {
        //     const devices = response?.devices;
        //     console.log('Devices', devices);
        //     await localStorage.setItem('devices', JSON.stringify(devices));
        // }
        // if (!error) {
        //     storeResponse();
        // }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Layout>
            <div className='overview-page-wrapper'>
                { loading && <Loading /> }
                <h2>Title</h2>
                <p className='bold'>{response?.devices}</p>
            </div>
        </Layout>
    );
};

export default Overview;