import React from "react";
import { useHistory } from "react-router-dom";
import { Table } from "antd";
import { EllipsisOutlined, PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";
import { convertAmount } from "../utils/amountConverter";

const overviewTableColumns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (value, row) => (
      <div className="table-item-wrapper">
        <span className="primary-row">
          { value.charAt(0).toUpperCase() + value.slice(1) }
        </span>
        <span className="secondary-row">
          { row.description }
        </span>
      </div>
      
    ),
  },
  {
    title: "Type",
    dataIndex: "type",
    key: "type",
    filters: [
      { text: "Producer", value: "producer" },
      { text: "Consumer", value: "consumer" },
    ],
    onFilter: (value, record) => record.type.includes(value),
    sorter: (a, b) => a.type.localeCompare(b.type),
    render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
  },
  {
    title: "Balance",
    dataIndex: "balance",
    key: "balance",
    sorter: (a, b) => Number(a) - Number(b),
    render: (value) => `${convertAmount(Number(value)).join(' ')}`,
  },
  {
    title: "Status",
    dataIndex: "running",
    key: "running",
    filters: [
      { text: "Running", value: "running" },
      { text: "Paused", value: "paused" },
    ],
    onFilter: (value, record) => record.running.includes(value),
    render: (running) =>
      running ? (
        <span className="text-running">
          <PlayCircleOutlined className={"icon-running"} /> Running
        </span>
      ) : (
        <span className="text-paused">
          <PauseCircleOutlined className={"icon-paused"} /> Paused
        </span>
      ),
  },
  {
    key: "x",
    width: 80,
    render: () => (
      <div>
        <EllipsisOutlined style={{ fontSize: "30px", color: "#aab8c2" }} />
      </div>
    ),
  },
];

const DevicesTable = ({ data }) => {
  let history = useHistory();
  console.log(data);

  return (
    <Table
      onRow={record => ({
          onClick: () => history.push(`/device/${record.id}`),
        }
      )}
      className="ant-table-cell"
      columns={ overviewTableColumns }
      dataSource={ data }
      rowKey={ item => item.id }
      pagination={{ hideOnSinglePage: true }}
    />
  );
};

export default DevicesTable;
