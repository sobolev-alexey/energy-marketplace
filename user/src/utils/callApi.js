import axios from "axios";
import { serverAPI } from "../config.json";

const callApi = async (url, payload) => {
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    const response = await axios.post(`${serverAPI}/${url}`, payload, { headers });
    console.log("API", response?.data);

    return { response: response?.data, error: null };
  } catch (error) {
    return { error, response: null };
  }
};

export default callApi;