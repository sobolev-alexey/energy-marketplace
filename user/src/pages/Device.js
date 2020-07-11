import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Tabs } from "antd";
import { Layout, Loading, DeviceForm, DeviceHeader, DeviceInfo, TransactionsTable } from "../components";
import callApi from "../utils/callApi";

const { TabPane } = Tabs;

const Device = () => {
  const { deviceId } = useParams();
  const [device, setDevice] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevice() {
      try {
        let user = await localStorage.getItem("user");
        user = JSON.parse(user);

        if (user?.userId && user?.apiKey) {
          const response = await callApi('info', { 
            userId: user?.userId,
            apiKey: user?.apiKey,
            deviceId
          });

          if (!response?.error && response?.status !== 'error') {
            const device = response?.device;
            console.log('Device page', device);
            setDevice(device);
            setLoading(false);
          } else {
            console.error("Error loading device data", response?.error);
          }
        }
      } catch (err) {
        console.error('Error while loading device data', err);
      }
    }
    
    loadDevice();
  }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
     {loading ? (
          <Loading />
      ) : (
        <React.Fragment>
          <DeviceHeader device={device} />
          <div className="device-page-wrapper">
            <Tabs tabBarGutter={50} centered defaultActiveKey="1">
              <TabPane tab="Overview" key="1">
                <DeviceInfo device={device} transactions={transactions} />
              </TabPane>
              <TabPane tab="Settings" key="2">
                <DeviceForm device={device} />
              </TabPane>
              <TabPane tab="Transactions" key="3">
                <div className="transactions-tab-wrapper">
                  <TransactionsTable data={transactions} />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </React.Fragment>
      )}
    </Layout>
  );
};

export default Device;
