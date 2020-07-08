import React, { useEffect, useState, useContext } from "react";
import { Input, Select, Divider } from "antd";
import { AppContext } from "../context/globalState";
import callApi from "../utils/callApi";
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
  const { user, setUser } = useContext(AppContext);

  useEffect(() => {
    async function loadUser() {
      try {
        if (user?.userId) {
          const { response, error } = await callApi('user', { userId: user?.userId });

          if (!error) {
            const devices = response?.devices?.map(device => ({ ...device, key: device.id, balance: device?.wallet?.balance }));
            setDevices(devices);
            setUser(response);
          } else {
            console.error("Error loading user data", error);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error while loading user data', err);
      }
    }
    
    loadUser();
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <div>
              <Divider className={"divider"} />
              <CustomTable 
                columns={overviewTableColumns} 
                devices={filteredDevices} 
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Overview;
