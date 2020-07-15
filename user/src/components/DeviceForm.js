import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { Form, Select, Input, InputNumber, Upload, Col, Row, Space, Switch } from "antd";
import firebase from "../firebase.config";
import callApi from "../utils/callApi";
import { Loading, CustomModal } from ".";

const { Option } = Select;

const normFile = (e) => {
  console.log("Upload event:", e);

  if (Array.isArray(e)) {
    return e;
  }
  return e && e.fileList;
};

const uuid_regex = "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$";

const NewDeviceForm = ({ device = {}, callback = null }) => {
  let history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState();

  const onFinish = async (values) => {
    console.log("Received values of form: ", values);
    try {
      setLoading(true);
      let user = await localStorage.getItem("user");
      user = JSON.parse(user);
      if (user?.userId && user?.apiKey) {
        const {
          name, 
          type, 
          location, 
          url, 
          description, 
          minOfferAmount, 
          maxEnergyPrice,
          uuid,
          running,
          dashboard
        } = values;
        const payload = {
          userId: user.userId,
          apiKey: user.apiKey,
          name, 
          type, 
          location, 
          url,
          description,
          minOfferAmount, 
          maxEnergyPrice, 
          uuid,
          running,
          dashboard
        }
        const response = await callApi('device', payload);
        setLoading(false);
        
        if (!response?.error && response?.status !== 'error') {
          console.log(response?.status);
          if (response?.deviceId) {
            history.push(`/device/${response?.deviceId}`);
          } else {
            history.push("/overview");
          }
        } else if (response?.error) {  
          setError(response?.error);
          setShowModal(true);
        }
      }
      typeof callback === 'function' && callback();
    } catch (err) {
      console.error('Error while loading user data', err);
    }
  };

  return (
    <Form 
      size="large" 
      layout="vertical" 
      name="device-form" 
      onFinish={onFinish} 
      hideRequiredMark
      initialValues={{
        uuid: "ac4a33f0-ee20-41e4-9fcd-9f91ecf77d0f",
        running: true,
        dashboard: false,
        ...device
      }}
    >
      <div className="device-page-wrapper">
        <Row justify="space-between">
          <Col>
            <Form.Item
              name="type"
              label="Type"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please select the type of your device",
                },
              ]}
            >
              <Select>
                <Option value="producer">Producer</Option> 
                <Option value="consumer">Consumer</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="name"
              label="Name"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the name of your device",
                },
                { 
                  validator: (_, value) => 
                    (!value || value.length < 50) 
                    ? Promise.resolve() 
                    : Promise.reject(`Please shorten the provided value to less than 50 characters`) 
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="uuid"
              label="Device UUID"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the UUID of your device",
                },
                { 
                  validator: (_, value) => 
                    (new RegExp(uuid_regex).test(value)) 
                    ? Promise.resolve() 
                    : Promise.reject(`UUID format is wrong`) 
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item label="Energy price (NOK per kWh)">
              <Form.Item 
                name="maxEnergyPrice"
                noStyle
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please provide the max. energy price for this device",
                  },
                  {
                    type: "number",
                    message: "This is not a valid value",
                  },
                  { 
                    validator: (_, value) => 
                      (!value || value > 0) 
                      ? Promise.resolve() 
                      : Promise.reject(`This is not a valid value`) 
                  },
                ]}
              >
                <InputNumber className="rounded-input" type="number" step={0.001} />
              </Form.Item>
            </Form.Item>
            <Form.Item name="running" label="Running" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" defaultChecked />
            </Form.Item>
            <Form.Item name="dashboard" label="Enable transaction dashboard" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" defaultChecked={false} />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item
              name="url"
              label="URL"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the URL of your device",
                },
                {
                  type: 'url',
                  message: 'This is not a valid URL',
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="location"
              label="Location"
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please provide the location of your device",
                },
              ]}
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description (optional)"
            >
              <Input className="rounded-input" />
            </Form.Item>
            <Form.Item label="Minimum offer/request energy value (kWh)">
              <Form.Item 
                name="minOfferAmount" 
                noStyle
                hasFeedback
                rules={[
                  {
                    required: true,
                    message: "Please provide the min. offer/request energy value for this device",
                  },
                  {
                    type: "number",
                    message: "This is not a valid value",
                  },
                  { 
                    validator: (_, value) => 
                      (!value || value > 0) 
                      ? Promise.resolve() 
                      : Promise.reject(`This is not a valid value`) 
                  },
                ]}
              >
                <InputNumber className="rounded-input" type="number" />
              </Form.Item>
            </Form.Item>
            <Form.Item
              className="no-file-selected"
              name="device-image"
              label="Device image"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              extra={<span> No file selected </span>}
            >
              <Upload 
                name="deviceImage" 
                listType="picture"
                action={`https://${firebase?.storageBucket}/devices`}
              >
                <button className="ant-btn-lg1"> Select file </button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </div>
      <div className="new-device-page-footer">
        {loading ? (
            <Loading />
        ) : (
          <Space size="middle">
            <Link to="/" className="cta-paused">
              Cancel
            </Link>
            <button className="cta-running" type="submit">
              Add a device
            </button>
          </Space>
        )}
      </div>
      {
        showModal && (
          <CustomModal 
            error={error}
            callback={() => setShowModal(false)}
            show={showModal}
          />
        )
      }
    </Form>
  );
};

export default NewDeviceForm;
