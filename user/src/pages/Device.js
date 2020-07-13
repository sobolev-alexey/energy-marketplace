import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Tabs } from "antd";
import { Layout, Loading, DeviceForm, DeviceHeader, DeviceInfo, TransactionsTable } from "../components";
import callApi from "../utils/callApi";

const { TabPane } = Tabs;

const Device = () => {
  const { deviceId } = useParams();
  const [device, setDevice] = useState();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeviceInitial() {
      try {
        await loadDevice();
      } catch (err) {
        console.error('Error while loading device data', err);
      }
    }
    
    loadDeviceInitial();
  }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadTransactions() {
      try {
        let user = await localStorage.getItem("user");
        user = JSON.parse(user);

        if (user?.userId && user?.apiKey && device?.id) {
          const transactionsResponse = await callApi('transactions', { 
            userId: user?.userId,
            apiKey: user?.apiKey,
            deviceId
          });

          if (!transactionsResponse?.error && transactionsResponse?.status !== 'error') {
            setTransactions(transactionsResponse?.transactions);
          } else {
            console.error("Error loading device data", transactionsResponse?.error);
          }
        }
      } catch (err) {
        console.error('Error while loading device data', err);
      }
    }
    
    loadTransactions();
  }, [device?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDevice() {
    try {
      let user = await localStorage.getItem("user");
      user = JSON.parse(user);

      if (user?.userId && user?.apiKey) {
        const infoResponse = await callApi('info', { 
          userId: user?.userId,
          apiKey: user?.apiKey,
          deviceId
        });

        if (!infoResponse?.error && infoResponse?.status !== 'error') {
          const device = infoResponse?.device;
          setDevice(device);
          setLoading(false);
        } else {
          console.error("Error loading device data", infoResponse?.error);
        }

        setLoading(false);
      }
    } catch (err) {
      console.error('Error while loading device data', err);
    }
  }

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
                <DeviceForm device={device} callback={loadDevice} />
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
