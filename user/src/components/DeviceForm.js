import React from "react";
import { Link } from "react-router-dom";

import { withRouter } from "react-router";

import { Form, Select, Input, Col, Row, Space } from "antd";

const { Option } = Select;

const DeviceForm = ({ device, onChange, fields }) => {
  //   console.log("record22", record);

  const onFinish = (values) => {
    console.log("Received values of form: ", values);
  };
  return (
    <Form
      fields={fields}
      fields={fields}
      onFieldsChange={(changedFields, allFields) => {
        onChange(allFields);
      }}
      size="large"
      layout="vertical"
      name="new-device-form"
      onFinish={onFinish}
      hideRequiredMark
    >
      <div className="fnew-device-page-wrapper">
        <Row justify="space-between">
          <Col flex="auto">
            <Form.Item
              name={["username"]}
              label="Name"
              hasFeedback
              value={device.name}
              rules={[
                {
                  required: true,
                  message: "Please enter the name of your device!",
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name={["user", "url"]}
              label="URL"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please enter the URL of your device!",
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="type"
              label="Type"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please select the type of your device!",
                },
              ]}
            >
              <Select placeholder="Producer">
                <Option value="producer"> Producer </Option> <Option value="consumer"> Consumer </Option>
              </Select>
            </Form.Item>
            <Form.Item label="Energy price (NOK per kWh)">
              <Form.Item name="energy-price" noStyle>
                <Input className="rounded-input" type="number" />
              </Form.Item>
            </Form.Item>
          </Col>
          <Col offset={1} flex="auto">
            <Form.Item label="Min wallet balance (Mi)">
              <Form.Item name="wallet-balance-Mi" noStyle>
                <Input className="rounded-input" type="number" />
              </Form.Item>
            </Form.Item>
            <Form.Item
              name={["user", "location"]}
              label="Location"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please select the location of your device!",
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="network"
              label="Network"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please select the Network",
                },
              ]}
            >
              <Select placeholder="IOTA Devnet">
                <Option value="iota-devnet"> IOTA Devnet </Option>
                <Option value="iota-devnet-2"> IOTA Devnet 2 </Option>
              </Select>
            </Form.Item>
            <Form.Item label="Minimum offer amount (kWh)">
              <Form.Item name="min-offer-amount-KWh" noStyle>
                <Input className="rounded-input" type="number" />
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>
      </div>
      <div className="fnew-device-page-footer">
        <Space size="middle">
          <Link to="/" className="cta-paused">
            Cancel
          </Link>
          <button className="cta-running" htmlType="submit">
            Save changes
          </button>
        </Space>
      </div>
    </Form>
  );
};

export default withRouter(DeviceForm);
