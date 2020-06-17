import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Sidebar = () => {
    return (
        <div className='sidebar-wrapper'>
            <Link to='/'>
                <img src={logo} alt='Logo' className='sidebar-logo' />
            </Link>

            <div className='sidebar-content'>
                <h3>
                    Main wallet
                </h3>
                <h1>
                    48.6 <p>Mi</p>
                </h1>
                <button onClick={() => console.log('Add funds') }>
                    Add funds
                </button>
                <Link to='/wallet' className='cta'>
                    Withdraw
                </Link>
            </div>
            <div className='sidebar-footer'>
                <Link to='/'>
                    Logout
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
