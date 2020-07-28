import React, { useState, useRef } from "react";
import { Link, useHistory } from "react-router-dom";
import { Form, Select, Input, InputNumber, Upload, Col, Row, Space, Switch } from "antd";
import callApi from "../utils/callApi";
import { storage } from "../utils/firebase";
import { Loading, CustomModal } from ".";

const { Option } = Select;

const uuid_regex = "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$";

const NewDeviceForm = ({ existingDevice = {}, callback = null }) => {
  let history = useHistory();
  const form = useRef();
  const [device, setDevice] = useState(existingDevice);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState();

  const uploadFile = async ({ file, onSuccess }) => {
    console.log("uploadFile", device?.deviceId, file);
    const promise = new Promise(async (resolve, reject) => {
      try {
        let retries = 0;
        while (retries++ < 40) {
          if (device?.deviceId) {
              break;
          }            
          await new Promise(resolved => setTimeout(resolved, 500));
        }
        
        if (device?.deviceId && file) {
          storage
            .ref(`${device?.deviceId}/` + file?.name)
            .put(file)
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(url => {
              console.log("uploadFile success", url);
              setImageUrl(url);
              onSuccess(() => form.current.submit());
              resolve(url)
            })
            .catch(error => {
              console.log("uploadFile error", error);
            });
        }
        reject();
      } catch (error) {
        console.log('uploadFile error', error);
        reject();
      }
    });

    return promise;
  };

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
          dashboard,
          image: imageUrl || existingDevice?.image
        }
        console.log('Device', payload);

        const response = await callApi('device', payload);
        setLoading(false);
        
        if (!response?.error && response?.status !== 'error') {
          console.log(response?.status);
          if (response?.deviceId) {
            setDevice({ ...payload, deviceId: response?.deviceId });
            // history.push(`/device/${response?.deviceId}`);
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
      ref={form}
      name="device-form" 
      onFinish={onFinish} 
      hideRequiredMark
      validateTrigger="onSubmit"
      initialValues={{
        running: true,
        dashboard: false,
        ...device
      }}
    >
      <div className="device-page-wrapper">
       <div className='device-page-content'>
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
            <Form.Item label="Energy price (per kWh)">
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
              extra={
                device?.image && !imageUrl && 
                <img className="upload-device-image" alt={device?.name} src={device?.image} />
              }
            >
              <React.Fragment>
                <Upload 
                  name="deviceImage" 
                  listType="picture"
                  accept="image/*"
                  customRequest={uploadFile}
                >
                  <button className="ant-btn-lg1"> Select image </button>
                </Upload>
              </React.Fragment>
            </Form.Item>
          </Col>
        </Row>
        </div>
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
              { existingDevice?.id ? "Update device" : "Add device" }
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