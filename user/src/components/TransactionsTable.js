import React, { useState, useRef } from "react";
import { Table, Input, Button, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { MessageList } from ".";

const TransactionsTable = ({ data }) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={dataIndex.charAt(0).toUpperCase() + dataIndex.slice(1)}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 200, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => searchInput.current.select());
      }
    }
  })

  const transactionOverviewTableColumns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      sorter: (a, b) => a.transactionId.localeCompare(b.transactionId),
      ...getColumnSearchProps('transactionId'),
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: (a, b) => a.timestamp.localeCompare(b.timestamp),
      ...getColumnSearchProps('timestamp'),
    },
    {
      title: "Amount kWh",
      dataIndex: "energyAmount",
      key: "energyAmount",
      sorter: (a, b) => a.energyAmount - b.energyAmount,
    },
    {
      title: "Value Mi",
      dataIndex: "energyPrice",
      key: "energyPrice",
      sorter: (a, b) => a.energyPrice - b.energyPrice,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Initial offer", value: "Initial offer" },
        { text: "Initial request", value: "Initial request" },
        { text: "Contract created", value: "Contract created" },
        { text: "Energy provision finished", value: "Energy provision finished" },
        { text: "Payment requested", value: "Payment requested" },
        { text: "Payment processed", value: "Payment processed" },
        { text: "Payment confirmed", value: "Payment confirmed" },
        { text: "Invalid", value: "Invalid" },
        { text: "Claim issued", value: "Claim issued" },
        { text: "Cancelled", value: "Cancelled" },
      ],
      onFilter: (value, record) => record.status.includes(value),
    },
  ];
  
  const transactionDetailsTableColumns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: (a, b) => a.timestamp.localeCompare(b.timestamp),
    },
    {
      title: "Amount kWh",
      dataIndex: "energyAmount",
      key: "energyAmount",
    },
    {
      title: "Value Mi",
      dataIndex: "energyPrice",
      key: "energyPrice",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
  ];
  

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
