import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout, Loading } from '../components';
// import config from '../config.json';

const Overview = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function callApi() {

            const response = await axios.get('https://randomuser.me/api/');
            const devices = response?.data?.results;

            // const response = await axios.get(`${config.serverAPI}/devices`);
            // const devices = response?.data?.status === 'success' && response?.data?.devices;
            // console.log('Devices', devices);
            
            await localStorage.setItem('devices', JSON.stringify(devices));
            setLoading(false);
        }
        callApi();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Layout>
            <div className='overview-page-wrapper'>
                { loading && <Loading /> }
                <h2>Title</h2>
                <p className='bold'>text</p>
            </div>
        </Layout>
    );
};

export default Overview;