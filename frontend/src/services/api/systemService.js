import httpClient from './httpClient';

export const systemService = {
  getSystemInfo: () => httpClient.get('/system/info'),
  getHealth: () => httpClient.get('/actuator/health', { baseURL: '' }),
};

export default systemService;
