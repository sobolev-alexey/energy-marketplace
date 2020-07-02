import React from "react";
import { Link } from "react-router-dom";

import { Card, Space } from "antd";
import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";

const { Meta } = Card;

const DeviceInfo = ({ device }) => (
  <div className="device-info">
    <Card
      className="device-overview-card"
      hoverable
      cover={<img className="device-image" alt="example" src={device.image} />}
    >
      <Meta title={device.name} description="https://eample.com" />
      {device.status === "running" ? (
        <span className="text-running">
          <PlayCircleOutlined className={"icon-running"} /> Running
        </span>
      ) : (
        <span className="text-paused">
          <PauseCircleOutlined className={"icon-paused"} /> Paused
        </span>
      )}
    </Card>
    <Card hoverable className="device-info-card">
      <span>DEVICE WALLET</span>
      <h1 className="wallet-balance-device">
        5.22 <span className="wallet-balance3-device">Mi</span>
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
    <Card hoverable className="device-info-card">
      <span>ENERGY PRODUCED</span>
      <h1 className="wallet-balance-device">
        575 <span className="wallet-balance3-device">kWh</span>
      </h1>
    </Card>
    <Card hoverable className="device-info-card">
      <span>TOTAL TRANSACTIONS</span>
      <h1 className="wallet-balance-device">483</h1>
    </Card>
    <Card hoverable className="device-info-card">
      <span>AVERAGE ENERGY PRICE</span>
      <h1 className="wallet-balance-device">
        1.28 <span className="wallet-balance3-device">Mi</span>
      </h1>
    </Card>
  </div>
);

export default DeviceInfo;
