import React from "react";
import { useHistory } from "react-router-dom";

import { Table } from "antd";

const CustomTable = ({ data, columns }) => {
  let history = useHistory();
  console.log(data);
  return (
    <Table
      onRow={record => ({
          onClick: () => history.push(`/device/${record.id}`),
        }
      )}
      className="ant-table-cell"
      columns={columns}
      dataSource={data}
      rowKey={item => {
        if (item?.id) return item.id;
        if (item?.type === 'offer') return `${item?.providerTransactionId}-${item?.status}`;
        if (item?.type === 'request') return `${item?.requesterTransactionId}-${item?.status}`;
      }}
      pagination={{ hideOnSinglePage: true }}
    />
  );
};

export default CustomTable;
