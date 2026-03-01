import axios from "axios";
import { API_BASE_URL } from "../config/env";

let authToken = "";

export const setAuthToken = token => {
  authToken = token || "";
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});
