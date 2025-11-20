import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:4000/api/v1",
  withCredentials: true, // Important for cookies
});

export const apiConnector = async (
  method,
  url,
  bodyData = {},
  headers = {},
  params = {}
) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data: bodyData,
      headers: { ...headers },
      params,
    });

    return response;
  } catch (error) {
    throw error;
  }
};
