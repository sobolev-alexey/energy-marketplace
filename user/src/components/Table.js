import React from "react";
import { withRouter } from "react-router-dom";

import { Table } from "antd";

const CustomTable = ({ history, devices, columns }) => {
  return (
    <Table
      onRow={(record) => {
        return {
          onClick: () => {
            history.push(`/device/${record.id}`, { record });
            // console.log("record", record);
          },
        };
      }}
      className="ant-table-cell"
      columns={columns}
      dataSource={devices}
      rowKey={device => device.id}
      pagination={{ hideOnSinglePage: true }}
    />
  );
};

export default withRouter(CustomTable);
