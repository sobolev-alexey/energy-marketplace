import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router';
import callApi from '../utils/callApi';
import { LogoutOutlined } from '@ant-design/icons';
import { AppContext } from '../context/globalState';
import { logout } from '../utils/firebase';
import logo from '../assets/logo.svg';
import { convertAmount } from '../utils/amountConverter';
import { Loading, CustomModal } from '../components';

const Sidebar = () => {
  let history = useHistory();
  const { setLoggedIn, user } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState();
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  // const balance = convertAmount(Number(user?.wallet?.balance));

  useEffect(() => {
    async function getBalance() {
      try {
        let user = await localStorage.getItem('user');
        user = JSON.parse(user);

        const response = await callApi('balance', user?.wallet);
        if (
          !response?.error &&
          response?.status !== 'error' &&
          response?.balance
        ) {
          setUserBalance(convertAmount(Number(response?.balance)));
        } else {
          console.log('Balance error', response?.error);
          setError(response?.error);
          setShow(true);
        }
      } catch (err) {
        console.error('Error while getting wallet balance', err);
      }
    }
    getBalance();
  }, [loading]);

  const addFunds = async () => {
    setLoading(true);
    try {
      const response = await callApi('faucet', user?.wallet);
      if (
        !response?.error &&
        response?.status !== 'error' &&
        response?.transactions
      ) {
      } else {
        console.log('Error', response?.error);
        setError(response?.error);
        setShow(true);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error while adding funds', err);
    }
  };

  const callback = async () => {
    setLoggedIn(false);
    await localStorage.clear();
    history.push('/');
  };

  console.log('User balance', userBalance);
  console.log('User', user);
  console.log('User wallet', user?.wallet);
  return (
    <div className='sidebar-wrapper'>
      <Link to='/'>
        <img src={logo} alt='Logo' className='sidebar-logo' />
      </Link>
      {loading ? (
        <Loading />
      ) : (
        <div className='sidebar-content'>
          <h5 className='main-wallet-text'> MAIN WALLLET </h5>
          <h1 className='wallet-balance'>
            {userBalance?.[0]}
            <span className='wallet-balance3'>{userBalance?.[1]}</span>
            {console.log('User balance', userBalance)}
            <span className='wallet-balance3'> Iota </span>
          </h1>
          <br />
          <button className='custom-button' onClick={() => addFunds()}>
            Add funds
          </button>
          <Link to='/wallet' className='cta'>
            Withdraw
          </Link>
          <CustomModal show={show} error={error} />
        </div>
      )}
      <div className='sidebar-footer'>
        <button className='logout' onClick={() => logout(callback)}>
          <LogoutOutlined rotate={180} />
          <span> </span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
