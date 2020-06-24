import React from 'react';
import ReactGA from 'react-ga';
import { withRouter } from 'react-router';
import Disclaimer from './Disclaimer';
// import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, match }) => {
    ReactGA.pageview(match.url);

    return (
        <div className='page-wrapper'>
            <Sidebar />
            <div className='main-section'>
                {/* <Header /> */}
                <div className='content'>
                    { children }
                </div>
            </div>
            <Disclaimer />
        </div>
    );
};

export default withRouter(Layout);
