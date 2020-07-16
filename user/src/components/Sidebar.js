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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      getBalance();
    }
    async function getBalance() {
      try {
        let user = await localStorage.getItem('user');
        user = JSON.parse(user);
        const response = await callApi('balance', user?.wallet);

        if (response?.balance && !response?.error && response?.status !== 'error') {
          const balance = convertAmount(Number(response?.balance));
          setUserBalance(balance);
          user.wallet.balance = balance[0];
          await localStorage.setItem('user', JSON.stringify(user));
        } else {
          console.log('Balance error', response?.error);
          setError(response?.error);
          setShowModal(true);
        }
      } catch (err) {
        console.error('Error while getting wallet balance', err);
      }
    }
  }, [loading]);

  const addFunds = async () => {
    setLoading(true);
    try {
      const response = await callApi('faucet', user?.wallet);
      
      if (response?.error || response?.status === 'error') {
        setError(response?.error);
        setShowModal(true);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error while adding funds', err);
    }
  };

  const userWithdraw = async () => {
    setLoading(true);
    try {
      let user = await localStorage.getItem('user');
      user = JSON.parse(user);

      if (user?.userId) {
        const response = await callApi('withdraw', { userId: user.userId });

        if (response?.error || response?.status === 'error') {
          setError(response?.error);
          setShowModal(true);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Error while withdrawing funds', err);
    }
  };

  const callback = async () => {
    setLoggedIn(false);
    await localStorage.clear();
    history.push("/");
  };

  return (
    <div className="sidebar-wrapper">
      <Link to="/">
        <img src={logo} alt="Logo" className="sidebar-logo" />
      </Link>
      {loading ? (
          <Loading />
        ) : (
        <div className="sidebar-content">
          <h5 className="main-wallet-text"> MAIN WALLLET </h5>
          <h1 className="wallet-balance">
            {userBalance?.[0]}
            <span className='wallet-balance3'>&nbsp;{userBalance?.[1]}</span>
          </h1>
          <br />
          <button className="custom-button" onClick={addFunds}>
            Add funds
          </button>
          <button className='custom-button-withdraw' onClick={userWithdraw}>
            Withdraw
          </button>
          {showModal && (
            <CustomModal
              error={error}
              callback={() => setShowModal(false)}
              show={showModal}
            />
          )}
        </div>
      )}
      <div className="sidebar-footer">
        <button className="logout" onClick={() => logout(callback)}>
          <LogoutOutlined rotate={180} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;