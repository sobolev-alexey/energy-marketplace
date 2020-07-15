import axios from "axios";
import { serverAPI } from "../config.json";

const callApi = async (url, payload) => {
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    const response = await axios.post(`${serverAPI}/${url}`, payload, { headers });
    return response?.data;
  } catch (error) {
    return { error };
  }
};

export default callApi;