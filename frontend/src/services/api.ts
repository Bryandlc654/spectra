import api from '../api/axios';
import type { Contract, ContractTemplate, SessionLog, PaginatedResponse, FreelanceProfile, SignerResponse } from '../types';

export const contractService = {
  list: () => api.get<Contract[]>('/contracts').then((r) => r.data),
  templates: () => api.get<ContractTemplate[]>('/contracts/templates').then((r) => r.data),
  create: (data: {
    templateId: number;
    freelancerUserId: number;
    freelancerName?: string;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
  }) => api.post('/contracts', { ...data, customData: { description: data.description } }),
  delete: (id: number) => api.delete(`/contracts/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/contracts/${id}/status`, { status }),
};

export const sessionLogService = {
  list: (page = 1, limit = 50) =>
    api.get<PaginatedResponse<SessionLog>>('/session-logs', { params: { page, limit } }).then((r) => r.data),
};

export const freelanceService = {
  profile: () => api.get<{ profile: FreelanceProfile }>('/freelance/profile').then((r) => r.data.profile),
};

export const signatureService = {
  getByToken: (token: string) => api.get<SignerResponse>(`/signatures/token/${token}`).then((r) => r.data),
  sign: (token: string, data: { signature: string; x?: number; y?: number }) =>
    api.post(`/signatures/token/${token}/sign`, data),
};
