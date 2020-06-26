import React from "react";
import { Table } from "antd";

const CustomTable = ({ devices, columns }) => {
  return (
    <Table className="ant-table-cell" columns={columns} dataSource={devices} pagination={{ hideOnSinglePage: true }} />
  );
};

export default CustomTable;
