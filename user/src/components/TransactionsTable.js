import React from "react";
import { Table } from "antd";
import { DeviceTableColumns } from "../assets/table-columns-data";

const TransactionsTable = ({ data }) => {
  console.log(444, data && Object.keys(data).length, data);

  const items = data && Object.keys(data)
    .map(key => data[key]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  );

  console.log(555, items);

  return (
    <Table
      className="ant-table-cell"
      columns={ DeviceTableColumns }
      dataSource={ items }
      rowKey={ item => `${item?.transactionId}-${item?.status}` }
      pagination={{ hideOnSinglePage: true }}
      expandable={{
        expandRowByClick: true,
        expandedRowRender: (record, index) => (
          <Table 
            columns={DeviceTableColumns}
            dataSource={data[record.transactionId]} 
            pagination={false} 
            rowKey={ item => item?.status }
          />
        )
      }}
    />
  );
};

export default TransactionsTable;
