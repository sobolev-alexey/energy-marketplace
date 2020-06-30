import React from "react";

import { Layout } from "../components";

import NewDeviceHeader from "../components/NewDeviceHeader";
import NewDeviceForm from "../components/NewDeviceForm";

const NewDevicePage = () => {
  return (
    <Layout>
      <NewDeviceHeader />
      <NewDeviceForm />
    </Layout>
  );
};

export default NewDevicePage;
