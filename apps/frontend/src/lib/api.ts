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
  updateCompany: (data: unknown) => api.put('/employer/company', data),
  getJobs: (params?: Record<string, unknown>) => api.get('/employer/jobs', { params }),
  createJob: (data: unknown) => api.post('/employer/jobs', data),
  getJob: (id: string) => api.get(`/employer/jobs/${id}`),
  updateJob: (id: string, data: unknown) => api.put(`/employer/jobs/${id}`, data),
  deleteJob: (id: string, password: string) => api.delete(`/employer/jobs/${id}`, { data: { password } }),
  submitJob: (id: string) => api.post(`/employer/jobs/${id}/submit`),
  duplicateJob: (id: string) => api.post(`/employer/jobs/${id}/duplicate`),
  getAllCandidates: () => api.get('/employer/candidates'),
  getCandidates: (jobId: string) => api.get(`/employer/jobs/${jobId}/candidates`),
  updateCandidateStatus: (applicationId: string, data: { status: string; feedback?: string; employerNote?: string }) => 
    api.put(`/employer/candidates/${applicationId}/status`, data),
  // 面试相关
  createInterview: (applicationId: string, data: { scheduledAt: string; mode: string; locationOrLink?: string; note?: string }) =>
    api.post(`/employer/applications/${applicationId}/interviews`, data),
  updateInterview: (interviewId: string, data: { scheduledAt?: string; mode?: string; locationOrLink?: string; note?: string; status?: string }) =>
    api.put(`/employer/interviews/${interviewId}`, data),
};

export const interviewApi = {
  respond: (interviewId: string, data: { status: string; studentComment?: string }) =>
    api.put(`/interviews/${interviewId}/respond`, data),
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
    getHistory: (params?: Record<string, unknown>) => api.get('/admin/review/history', { params }),
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
    exportLogs: async (params?: Record<string, unknown>) => {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const url = `${baseURL}/admin/audit/logs/export${queryString ? `?${queryString}` : ''}`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || '导出失败');
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } catch (error) {
        console.error('导出失败:', error);
        throw error;
      }
    },
  },
};

export const bookmarkApi = {
  list: (params?: Record<string, unknown>) => api.get('/bookmarks', { params }),
};

export const applicationApi = {
  list: (params?: Record<string, unknown>) => api.get('/applications', { params }),
  get: (id: string) => api.get(`/applications/${id}`),
  events: (id: string) => api.get(`/applications/${id}/events`),
  interview: (id: string) => api.get(`/applications/${id}/interview`),
};

export const notificationApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  readAll: () => api.put('/notifications/read-all'),
};
