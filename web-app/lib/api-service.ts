"use client";

/**
 * API服务 - 负责与后端API交互
 */

import { LogEntry } from './log-service';

// API端点配置
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  endpoints: {
    logs: '/api/logs',
    candidates: '/api/candidates',
    operations: '/api/operations',
  }
};

// 响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 候选人数据接口
export interface CandidateData {
  id: string;
  name: string;
  education: string;
  experience: string;
  skills: string[];
  company?: string;
  school?: string;
  position?: string;
  detail?: {
    workExperience?: string;
    educationExperience?: string;
    projectExperience?: string;
    expectation?: string;
  };
  status?: 'new' | 'processing' | 'contacted' | 'rejected' | 'hired';
  createdAt?: string;
  updatedAt?: string;
}

// 操作日志接口
export interface OperationLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  dataType?: string;
  dataId?: string;
  metadata?: Record<string, any>;
}

/**
 * API服务类
 */
export class ApiService {
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_CONFIG.baseUrl;
  }
  
  /**
   * 通用请求方法
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // 包含跨域Cookie
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const result = await response.json();
        return {
          success: response.ok,
          data: result.data,
          message: result.message,
          error: !response.ok ? result.error || response.statusText : undefined
        };
      } else {
        const text = await response.text();
        return {
          success: response.ok,
          data: text as unknown as T,
          error: !response.ok ? response.statusText : undefined
        };
      }
    } catch (error) {
      console.error('API请求错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  // ========== 日志相关API ==========
  
  /**
   * 获取操作日志列表
   * @param limit 限制条数
   * @param offset 偏移量
   */
  async getLogs(limit: number = 100, offset: number = 0): Promise<ApiResponse<OperationLog[]>> {
    return this.request<OperationLog[]>(
      `${API_CONFIG.endpoints.logs}?limit=${limit}&offset=${offset}`
    );
  }
  
  /**
   * 添加操作日志
   * @param log 日志数据
   */
  async addLog(log: Omit<OperationLog, 'id'>): Promise<ApiResponse<OperationLog>> {
    return this.request<OperationLog>(
      API_CONFIG.endpoints.logs,
      'POST',
      log
    );
  }
  
  /**
   * 清空日志
   */
  async clearLogs(): Promise<ApiResponse<void>> {
    return this.request<void>(
      API_CONFIG.endpoints.logs,
      'DELETE'
    );
  }
  
  /**
   * 导出日志
   */
  async exportLogs(): Promise<ApiResponse<string>> {
    return this.request<string>(
      `${API_CONFIG.endpoints.logs}/export`
    );
  }
  
  // ========== 候选人相关API ==========
  
  /**
   * 获取候选人列表
   * @param limit 限制条数
   * @param offset 偏移量
   */
  async getCandidates(limit: number = 100, offset: number = 0): Promise<ApiResponse<CandidateData[]>> {
    return this.request<CandidateData[]>(
      `${API_CONFIG.endpoints.candidates}?limit=${limit}&offset=${offset}`
    );
  }
  
  /**
   * 获取候选人详情
   * @param id 候选人ID
   */
  async getCandidateById(id: string): Promise<ApiResponse<CandidateData>> {
    return this.request<CandidateData>(
      `${API_CONFIG.endpoints.candidates}/${id}`
    );
  }
  
  /**
   * 更新候选人状态
   * @param id 候选人ID
   * @param status 新状态
   */
  async updateCandidateStatus(id: string, status: CandidateData['status']): Promise<ApiResponse<CandidateData>> {
    return this.request<CandidateData>(
      `${API_CONFIG.endpoints.candidates}/${id}/status`,
      'PUT',
      { status }
    );
  }
  
  /**
   * 获取操作统计
   */
  async getOperationStats(): Promise<ApiResponse<any>> {
    return this.request<any>(
      `${API_CONFIG.endpoints.operations}/stats`
    );
  }
}

// 创建单例实例
let apiServiceInstance: ApiService | null = null;

/**
 * 获取API服务实例
 */
export function getApiService(): ApiService {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiService();
  }
  return apiServiceInstance;
} 