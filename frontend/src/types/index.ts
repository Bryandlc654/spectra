export interface Signer {
  id: number;
  name: string;
  email: string;
  role: string;
  signOrder: number;
  hasSigned: boolean;
  signedAt?: string;
  signatureData?: string;
}

export interface SignDocument {
  id: number;
  title: string;
  filePath: string;
  mimeType?: string;
  signers: Signer[];
}

export interface SignerResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  document: SignDocument;
}

export interface FreelanceProfile {
  id: number;
  code?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Contract {
  id: number;
  title: string;
  content: string;
  status: string;
  tenantUserId: number;
  tenantName?: string;
  freelancerUserId: number;
  freelancerName?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  template?: { id: number; name: string };
  createdAt: string;
}

export interface ContractTemplate {
  id: number;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface SessionLog {
  id: number;
  userId: number;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: { id: number; name: string };
}

export interface Freelancer {
  id: number;
  name: string;
  email: string;
  code?: string;
  phone?: string;
  country?: string;
  documentId?: string;
  areaId?: number;
  yearsOfExperience?: number;
  skills?: string;
  bio?: string;
  tenantId?: number;
  createdAt: string;
}

export interface AdminTenant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  tenant: { id: number; businessName: string; name: string };
  createdAt: string;
}

export interface Tenant {
  id: number;
  name: string;
  businessName: string;
  taxId?: string;
  country?: string;
  baseCurrency?: string;
  status: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  users?: ManagedUser[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
