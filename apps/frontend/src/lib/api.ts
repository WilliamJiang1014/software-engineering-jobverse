import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Token 过期，清除本地存储并跳转到登录页
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(data);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// API 方法
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { email: string; password: string; name: string }) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const jobApi = {
  list: (params?: Record<string, unknown>) => api.get('/jobs', { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  apply: (id: string, data?: { resume?: string }) => api.post(`/jobs/${id}/apply`, data),
  bookmark: (id: string) => api.post(`/jobs/${id}/bookmark`),
  unbookmark: (id: string) => api.delete(`/jobs/${id}/bookmark`),
};

export const searchApi = {
  jobs: (params: Record<string, unknown>) => api.get('/search/jobs', { params }),
  suggest: (q: string) => api.get('/search/suggest', { params: { q } }),
  hot: () => api.get('/search/hot'),
};

export const companyApi = {
  get: (id: string) => api.get(`/companies/${id}`),
  jobs: (id: string) => api.get(`/companies/${id}/jobs`),
};

