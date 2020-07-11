import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Space, Row, Col } from "antd";
import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";
import { Loading } from ".";

const { Meta } = Card;

const DeviceInfo = ({ device, transactions }) => {
  const [energy, setEnergy] = useState();
  const [total, setTotal] = useState();
  const [price, setPrice] = useState();

  useEffect(() => {
    const transactionsCount = transactions && Object.keys(transactions)?.length;
    if (transactions && transactionsCount > 0) {
      setTotal(transactionsCount);

      let totalEnergy = 0;
      let totalPrice = 0;
      let totalCount = 0;
      Object.values(transactions).forEach(array => {
        array.find(entry => {
          if (entry?.status === 'Energy provision finished') {
            totalEnergy += Number(entry?.energyAmount);
            totalPrice += Number(entry?.energyPrice);
            totalCount++;
          }
        })
      });
      setEnergy(totalEnergy);
      setPrice((totalPrice / totalCount || 0).toFixed(2));
    }
  }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  console.log('transactions', transactions);
  return (
    <div className="device-info">
      <Row gutter={20}>
        <Col span={16}>
          <Card
            className="device-overview-card"
            hoverable
            cover={<img className="device-image" alt="example" src={device?.image} />}
          >
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
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable className="device-info-card">
            <span> DEVICE WALLET </span>
            <h1 className="transaction-info-device">
              { device?.wallet?.balance } <span className="wallet-balance3-device"> Iota </span>
            </h1>
            <div>
              <Space size={10}>
                <button className="cta-device" onClick={() => console.log("Add funds")}>
                  Add funds
                </button>
                <Link to="/wallet" className="cta-device-withdraw">
                  Withdraw
                </Link>
              </Space>
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
              { !energy ? (
                <Loading />
              ) : (
                <React.Fragment>
                  { energy } <span className="wallet-balance3-device"> kWh </span>
                </React.Fragment>
              )}
            </h1>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable className="device-info-card">
            <span> TOTAL TRANSACTIONS </span> 
            <h1 className="transaction-info-device"> 
              { !total ? (
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
              { !total ? (
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
}

export default DeviceInfo;
