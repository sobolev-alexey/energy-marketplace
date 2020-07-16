import React, { useEffect, useState, useContext } from 'react';
import callApi from '../utils/callApi';
import { AppContext } from '../context/globalState';
import { Card, Space, Row, Col } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { convertAmount } from '../utils/amountConverter';
import { Loading, CustomModal } from '.';

const { Meta } = Card;

const DeviceInfo = ({ device, transactions }) => {
  const [energy, setEnergy] = useState();
  const [total, setTotal] = useState();
  const [price, setPrice] = useState();
  const { user, updateUser } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [deviceBalance, setDeviceBalance] = useState(convertAmount(Number(device?.wallet?.balance)));
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const transactionsCount = transactions && Object.keys(transactions)?.length;
    if (typeof transactions === 'object') {
      setTotal(transactionsCount || 0);

      let totalEnergy = 0;
      let totalPrice = 0;
      let totalCount = 0;
      Object.values(transactions).forEach(array => {
        array.forEach(entry => {
          if (entry?.status === 'Energy provision finished') {
            totalEnergy += Number(entry?.energyAmount);
            totalPrice += Number(entry?.energyPrice);
            totalCount++;
          }
        });
      });
      setEnergy(totalEnergy || 0);
      setPrice((totalPrice / totalCount || 0).toFixed(2));
    }
  }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps


  const addFunds = async () => {
    setLoading(true);
    try {
      if (user?.userId && device?.id) {
        const payload = {
          userId: user?.userId,
          apiKey: user?.apiKey,
          deviceId: device?.id,
        };
        const response = await callApi('faucet', payload);

        if (response?.error || response?.status === 'error') {
          setError(response?.error);
          setShowModal(true);
        }
        await getBalance();
        await updateUser();
        setLoading(false);
      }
    } catch (err) {
      console.error('Error while adding funds', err);
    }
  };

  const withdraw = async () => {
    setLoading(true);
    try {
      if (user?.userId && device?.id) {
        const payload = {
          userId: user?.userId,
          apiKey: user?.apiKey,
          deviceId: device?.id,
        };
        const response = await callApi('withdraw', payload);

        if (response?.error || response?.status === 'error') {
          setError(response?.error);
          setShowModal(true);
        }
        await getBalance();
        await updateUser();
        setLoading(false);
      }
    } catch (err) {
      console.error('Error while adding funds', err);
    }
  };

  const getBalance = async () => {
    try {
      const response = await callApi('balance', device?.wallet);
      if (!response?.error && response?.status !== 'error') {
        const balance = convertAmount(Number(response?.balance));
        setDeviceBalance(balance);
      } else {
        console.log('Balance error', response?.error);
        setError(response?.error);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error while getting wallet balance', err);
    }
  }

  return (
    <div className="device-info">
      <Row gutter={20}>
        <Col span={16}>
          <Card
            className="device-overview-card"
            hoverable
            cover={device?.image && <img className="device-image" alt={device?.name} src={device?.image} />}
          >
            {
              device?.dashboard && device?.url ? (
                <a 
                  target='_blank'
                  rel='noopener noreferrer'
                  href={`${device?.url}/admin/board`}
                >
                  <DeviceCard device={device} />
                </a>
               ) : <DeviceCard device={device} />
            }
          </Card>
        </Col>
        <Col span={8}>
        <Card hoverable className='device-info-card'>
            <span> DEVICE WALLET </span>
            <div className='wallet-info-device'>
              {loading ? (
                <Loading />
              ) : (
                <React.Fragment>
                  <h1>
                    {deviceBalance?.[0] || 0}
                    <span className='wallet-balance3-device'> {deviceBalance?.[1]} </span>
                  </h1>
                  <br />
                  <Space size={10}>
                    <button className='cta-device' onClick={addFunds}>
                      Add funds
                    </button>
                    <button className='cta-device-withdraw' onClick={withdraw}>
                      Withdraw
                    </button>
                  </Space>
                  {showModal && (
                    <CustomModal
                      error={error}
                      callback={() => setShowModal(false)}
                      show={showModal}
                    />
                  )}
                </React.Fragment>
              )}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Card hoverable className="device-info-card">
            { 
              device?.type === 'requester'
              ? <span> ENERGY CONSUMED </span>
              : <span> ENERGY PRODUCED </span>
            }
            <h1 className="transaction-info-device">
              { energy === undefined ? (
                <Loading />
              ) : (
                <React.Fragment>
                  { energy } <span className="wallet-balance3-device"> W </span>
                </React.Fragment>
              )}
            </h1>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable className="device-info-card">
            <span> TOTAL TRANSACTIONS </span> 
            <h1 className="transaction-info-device"> 
              { total === undefined ? (
                <Loading />
              ) : (
                <React.Fragment>
                  { total }
                </React.Fragment>
              )}
            </h1>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable className="device-info-card">
            <span> AVERAGE ENERGY PRICE </span>
            <h1 className="transaction-info-device">
              { price === undefined ? (
                <Loading />
              ) : (
                <React.Fragment>
                  { price } <span className="wallet-balance3-device"> Iota </span>
                </React.Fragment>
              )}
            </h1>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const DeviceCard = ({ device }) => (
  <React.Fragment>
    <Meta title={device?.name.charAt(0).toUpperCase() + device?.name.slice(1)} description={(
      <div className="description">
        { device?.description.charAt(0).toUpperCase() + device?.description.slice(1) }
        <br /><br />
        { device?.url }
      </div>
      )} />
    {device?.running ? (
      <span className="text-running">
        <PlayCircleOutlined className={"icon-running"} /> Running
      </span>
    ) : (
      <span className="text-paused">
        <PauseCircleOutlined className={"icon-paused"} /> Paused
      </span>
    )}
  </React.Fragment>
)

export default DeviceInfo;
