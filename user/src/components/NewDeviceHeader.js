import React from "react";
import { Link } from "react-router-dom";

import { Space } from "antd";
import { LeftCircleFilled } from "@ant-design/icons";

const NewDeviceHeader = () => (
  <div className="header-wrapper2">
    <Space size={40} align="center">
      <Link to="/">
        <LeftCircleFilled className={"cta3"} />
      </Link>
      <h5> Add a new device </h5>
    </Space>
  </div>
);

export default NewDeviceHeader;
