import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  // 开发环境默认走 API Gateway（3000），确保能路由到所有微服务
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 打印请求日志，方便调试
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

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

export const employerApi = {
  getDashboardStats: () => api.get('/employer/dashboard'),
  getCompany: () => api.get('/employer/company'),
  getJobs: (params?: Record<string, unknown>) => api.get('/employer/jobs', { params }),
  createJob: (data: unknown) => api.post('/employer/jobs', data),
  getJob: (id: string) => api.get(`/employer/jobs/${id}`),
  updateJob: (id: string, data: unknown) => api.put(`/employer/jobs/${id}`, data),
  deleteJob: (id: string, password: string) => api.delete(`/employer/jobs/${id}`, { data: { password } }),
  submitJob: (id: string) => api.post(`/employer/jobs/${id}/submit`),
  getAllCandidates: () => api.get('/employer/candidates'),
  getCandidates: (jobId: string) => api.get(`/employer/jobs/${jobId}/candidates`),
  updateCandidateStatus: (applicationId: string, status: string) => 
    api.put(`/employer/candidates/${applicationId}/status`, { status }),
};

export const adminApi = {
  review: {
    getPendingJobs: (params?: Record<string, unknown>) => api.get('/admin/review/pending', { params }),
    getJobDetail: (id: string) => api.get(`/admin/review/jobs/${id}`),
    reviewJob: (id: string, data: { status: string; comment?: string }) => 
      api.post(`/admin/review/jobs/${id}`, data),
    getCompanies: (params?: Record<string, unknown>) => api.get('/admin/review/companies', { params }),
    verifyCompany: (id: string, verified: boolean) => 
      api.put(`/admin/review/companies/${id}/verify`, { verified }),
  },
  risk: {
    getRules: (params?: Record<string, unknown>) => api.get('/admin/risk/rules', { params }),
    createRule: (data: unknown) => api.post('/admin/risk/rules', data),
    updateRule: (id: string, data: unknown) => api.put(`/admin/risk/rules/${id}`, data),
    deleteRule: (id: string) => api.delete(`/admin/risk/rules/${id}`),
  },
  audit: {
    getLogs: (params?: Record<string, unknown>) => api.get('/admin/audit/logs', { params }),
    getLogDetail: (id: string) => api.get(`/admin/audit/logs/${id}`),
    getStats: () => api.get('/admin/audit/stats'),
  },
};

export const bookmarkApi = {
  list: (params?: Record<string, unknown>) => api.get('/bookmarks', { params }),
};

export const applicationApi = {
  list: (params?: Record<string, unknown>) => api.get('/applications', { params }),
  getStats: () => api.get('/applications/stats'),
};

