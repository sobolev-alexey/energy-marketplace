import React from "react";
import { Table } from "antd";

const CustomTable = ({ devices, columns }) => {
  return <Table className="ant-table-cell" columns={columns} dataSource={devices} />;
};

export default CustomTable;
