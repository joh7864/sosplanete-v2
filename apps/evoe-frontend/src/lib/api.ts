import axios from 'axios';

export const evoeClient = axios.create();

evoeClient.interceptors.request.use((config) => {
  const savedToken =
    localStorage.getItem('evoe_token') || sessionStorage.getItem('evoe_token');
  const savedAuth =
    localStorage.getItem('evoe_auth') || sessionStorage.getItem('evoe_auth');
  const savedInstanceId =
    localStorage.getItem('instanceId') ||
    sessionStorage.getItem('instanceId');

  if (savedToken) {
    config.headers.set('Authorization', `Bearer ${savedToken}`);
  } else if (savedAuth) {
    config.headers.set('Authorization', `Basic ${savedAuth}`);
  }

  if (savedInstanceId) {
    config.headers.set('x-instance-id', savedInstanceId);
  }

  return config;
});
