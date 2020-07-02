import React from "react";
import { Link } from "react-router-dom";
import { withRouter } from "react-router";

import { Space } from "antd";
import { PauseOutlined, CaretRightOutlined, LeftCircleFilled, DeleteOutlined } from "@ant-design/icons";

const DeviceHeader = ({ device }) => {
  return (
    <div className="header-wrapper2">
      <Space size={40} align="center">
        <Link to="/">
          <LeftCircleFilled className={"cta3"} />
        </Link>
        <h5> {device.name} </h5>
      </Space>

      <Space size={25} align="center">
        <button className="delete-button">
          <DeleteOutlined style={{ fontSize: "22px" }} />
          Delete
        </button>
        {device.status === "paused" ? (
          <button onClick={() => !device.status} className="cta4">
            <PauseOutlined style={{ fontSize: "32px" }} />
            Pause operation <span> </span>
          </button>
        ) : (
          <button onClick={() => !device.status} className="cta4">
            <CaretRightOutlined style={{ fontSize: "32px" }} />
            Continue operation <span> </span>
          </button>
        )}
      </Space>
    </div>
  );
};

export default DeviceHeader;
