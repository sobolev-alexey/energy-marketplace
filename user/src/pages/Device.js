import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { Tabs } from "antd";
import { Layout, Loading, NewDeviceForm, DeviceHeader, DeviceInfo, Table } from "../components";
import callApi from "../utils/callApi";
import { DeviceTableColumns } from "../assets/table-columns-data";

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
          const { response, error } = await callApi('info', { 
            userId: user?.userId,
            apiKey: user?.apiKey,
            deviceId
          });

          if (!error) {
            const device = response?.device;
            console.log(222, device);
            setDevice(device);
            setLoading(false);
          } else {
            console.error("Error loading device data", error);
          }
        }
      } catch (err) {
        console.error('Error while loading device data', err);
      }
    }
    
    loadDevice();
  }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [fields, setFields] = useState([
    {
      name: ["username"],
      value: device?.name,
    },
  ]);
  const callback = (key) => {
    console.log(key);
  };

  return (
    <Layout>
     {loading ? (
          <Loading />
      ) : (
        <React.Fragment>
          <DeviceHeader device={device} />
          <div className="device-page-wrapper">
            <Tabs tabBarGutter={50} centered defaultActiveKey="1" onChange={callback}>
              <TabPane tab="Overview" key="1">
                <DeviceInfo device={device} />
              </TabPane>
              <TabPane tab="Settings" key="2">
                <NewDeviceForm
                  fields={fields}
                  onChange={(newFields) => {
                    setFields(newFields);
                  }}
                  device={device}
                />
              </TabPane>
              <TabPane tab="Transactions" key="3">
                <div className="transactions-tab-wrapper">
                  <Table columns={DeviceTableColumns} />
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
