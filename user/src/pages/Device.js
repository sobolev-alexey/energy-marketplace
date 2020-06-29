import React from "react";
import { withRouter } from "react-router";
import { Tabs } from "antd";
import { Layout, Form, Table } from "../components";

const { TabPane } = Tabs;

const device = {
  name: "name",
  status: "running",
  image: "https://firebasestorage.googleapis.com/v0/b/cityexchange-energymarketplace.appspot.com/o/temp%2Fsolar_panel_PNG126.png?alt=media&token=fc2c39fd-14c7-471c-9b27-c144eab9b88a"
};

const Device = ({ match}) => {
  console.log("Device page", match);
  const callback = key => {
    console.log(key);
  };

  return (
    <Layout>
      <div className="device-page-wrapper">
        <Tabs defaultActiveKey="1" onChange={callback}>
          <TabPane tab="Overview" key="1">
            <DeviceInfo />
          </TabPane>
          <TabPane tab="Settings" key="2">
            <Form />
          </TabPane>
          <TabPane tab="Transactions" key="3">
            <Table />
          </TabPane>
        </Tabs>
      </div>
    </Layout>
  );
};

const DeviceInfo = () => (
  <div className="device-info">
        Device page
    { device.name }
    <img alt="" src={device.image} />
  </div>
);

export default withRouter(Device);