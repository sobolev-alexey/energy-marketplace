import React, { useState } from "react";

import { withRouter } from "react-router";

import { Tabs } from "antd";

import { Layout, DeviceForm } from "../components";
import DeviceHeader from "../components/DeviceHeader";
import DeviceInfo from "../components/DeviceInfo";
import CustomTable from "../components/Table";

import { DeviceTableColumns } from "../assets/table-columns-data";

const { TabPane } = Tabs;

const device2 = {
  name: "name",
  status: "running",
  image:
    "https://firebasestorage.googleapis.com/v0/b/cityexchange-energymarketplace.appspot.com/o/temp%2Fsolar_panel_PNG126.png?alt=media&token=fc2c39fd-14c7-471c-9b27-c144eab9b88a",
};

const Device = ({ history }) => {
  const { record } = history.location.state;
  const [fields, setFields] = useState([
    {
      name: ["username"],
      value: record.name,
    },
  ]);
  const callback = (key) => {
    console.log(key);
  };

  return (
    <Layout>
      <DeviceHeader device={record} />
      <div className="device-page-wrapper">
        <Tabs tabBarGutter={50} centered defaultActiveKey="1" onChange={callback}>
          <TabPane tab="Overview" key="1">
            <DeviceInfo device={{ ...record, image: device2.image }} />
          </TabPane>
          <TabPane tab="Settings" key="2">
            <DeviceForm
              fields={fields}
              onChange={(newFields) => {
                setFields(newFields);
              }}
              device={record}
            />
          </TabPane>
          <TabPane tab="Transactions" key="3">
            <div className="transactions-tab-wrapper">
              <CustomTable columns={DeviceTableColumns} />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </Layout>
  );
};

export default withRouter(Device);
