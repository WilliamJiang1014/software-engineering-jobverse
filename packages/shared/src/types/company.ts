/**
 * 企业信息
 */
export interface Company {
  id: string;
  name: string;
  industry?: string;
  scale?: string;
  location?: string;
  description?: string;
  logo?: string;
  website?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  verifiedBySchool: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建企业请求
 */
export interface CreateCompanyRequest {
  name: string;
  industry?: string;
  scale?: string;
  location?: string;
  description?: string;
  logo?: string;
  website?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * 更新企业请求
 */
export interface UpdateCompanyRequest {
  name?: string;
  industry?: string;
  scale?: string;
  location?: string;
  description?: string;
  logo?: string;
  website?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}


