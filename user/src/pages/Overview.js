import React, { useEffect, useState } from "react";
import { withRouter } from "react-router";
import axios from "axios";
import { Layout, Loading } from "../components";
import { Input, Select, Divider } from "antd";

// import config from '../config.json';

import CustomTable from "../components/Table";
import OverviewHeader from "../components/OverviewHeader";
import { overviewTableColumns } from "../assets/table-columns-data";

const { Search } = Input;
const { Option } = Select;

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [sortValue, setSortValue] = useState("");

  useEffect(() => {
    async function callApi() {
      const response = await axios.get(`https://jsonplaceholder.typicode.com/users`);
      const devices = response.data;
      setDevices(devices.map(device => ({ ...device, key: device.id })));
      // const response = await axios.get(`${config.serverAPI}/devices`);
      // const devices = response?.data?.status === 'success' && response?.data?.devices;
      // console.log("Devices", devices);

      await localStorage.setItem("devices", JSON.stringify(devices));
      setLoading(false);
    }
    callApi();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setFilteredDevices(devices.filter((device) => device.name.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [searchQuery, devices, sortValue]);

  const setDevicesSort = (value) => {
    if (value === "A-Z") {
      setSortValue("A-Z");
      setFilteredDevices(devices.sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setSortValue("Z-A");
      setFilteredDevices(devices.sort((a, b) => a.name.localeCompare(b.name)).reverse());
    }
  };

  return (
    <Layout>
      <OverviewHeader />
      <div className="overview-page-wrapper">
        {loading ? (
          <Loading />
        ) : (
          <div>
            <div className="overview-sub-header-wrapper">
              <Select defaultValue="A-Z" style={{ width: "188px" }} onChange={setDevicesSort}>
                <Option value="A-Z">Sort by: A-Z</Option>
                <Option value="Z-A">Sort by: Z-A</Option>
              </Select>

              <Search
                placeholder="Search for devices"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                style={{ width: 300 }}
              />
            </div>
            {/* {console.log(searchQuery)} */}
            <div>
              <Divider className={"divider"} />
              <CustomTable columns={overviewTableColumns} devices={filteredDevices} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Overview;
