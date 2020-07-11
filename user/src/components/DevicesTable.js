import React from "react";
import { useHistory } from "react-router-dom";
import { Table } from "antd";

const DevicesTable = ({ data, columns }) => {
  let history = useHistory();
  console.log(data);

  return (
    <Table
      onRow={record => ({
          onClick: () => history.push(`/device/${record.id}`),
        }
      )}
      className="ant-table-cell"
      columns={ columns }
      dataSource={ data }
      rowKey={ item => item.id }
      pagination={{ hideOnSinglePage: true }}
    />
  );
};

export default DevicesTable;
