import React from "react";
import { useHistory } from "react-router-dom";

import { Table } from "antd";

const CustomTable = ({ devices, columns }) => {
  let history = useHistory();
  
  return (
    <Table
      onRow={(record) => ({
          onClick: () => history.push(`/device/${record.id}`),
        }
      )}
      className="ant-table-cell"
      columns={columns}
      dataSource={devices}
      rowKey={device => device.id}
      pagination={{ hideOnSinglePage: true }}
    />
  );
};

export default CustomTable;
