import axios from 'axios';
import { ElLoading } from 'element-plus';

let loadingInstance: ReturnType<typeof ElLoading.service> | null = null;

// Request interceptor
axios.interceptors.request.use(config => {
  loadingInstance = ElLoading.service({ fullscreen: true, text: '加载中...' });
  return config;
}, error => {
  if (loadingInstance) loadingInstance.close();
  return Promise.reject(error);
});

// Response interceptor
axios.interceptors.response.use(response => {
  if (loadingInstance) loadingInstance.close();
  return response.data;
}, error => {
  if (loadingInstance) loadingInstance.close();
  return Promise.reject(error);
});

export default axios; 