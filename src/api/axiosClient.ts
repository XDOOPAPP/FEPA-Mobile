import axios from 'axios';
import { GATEWAY_URL } from '../constants';

const axiosClient = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosClient;
