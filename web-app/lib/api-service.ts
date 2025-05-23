"use client";

/**
 * API服务 - 负责与后端API交互
 */

import { LogEntry } from './log-service';

// API端点配置
const API_CONFIG = {
  // 强制使用外部Python API，不使用Next.js内置路由
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  endpoints: {
    logs: '/api/logs',
    candidates: '/api/candidates',
    operations: '/api/operations',
  },
  // 添加重试配置
  retryAttempts: 3,
  retryDelay: 1000, // 1秒
};

// 是否启用调试模式
const DEBUG_MODE = true;

// 响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 候选人数据接口
export interface CandidateData {
  id?: string;
  name?: string;
  education?: string;
  experience?: string;
  skills?: string[];
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
  matchScore?: number;  // 匹配度得分
  match?: number;       // 兼容旧版匹配度
  greeting?: string;    // 打招呼语
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
    if (DEBUG_MODE) {
      console.log(`API服务初始化，baseUrl: ${this.baseUrl}`);
      console.log(`强制使用外部Python API，不使用Next.js内置路由`);
    }
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 通用请求方法（带重试机制）
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`DEBUG: 开始API请求: ${method} ${url} (尝试 ${retryCount + 1}/${API_CONFIG.retryAttempts + 1})`);
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // 包含跨域Cookie
        // 添加超时设置
        signal: AbortSignal.timeout(10000), // 10秒超时
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      if (DEBUG_MODE) {
        console.log(`API请求: ${method} ${url}`, data ? data : '');
      }
      
      const response = await fetch(url, options);
      console.log(`DEBUG: 收到响应状态: ${response.status} ${response.statusText}`);
      const contentType = response.headers.get('content-type');
      console.log(`DEBUG: 响应内容类型: ${contentType}`);
      
      let result: any;
      
      if (contentType?.includes('application/json')) {
        result = await response.json();
        
        console.log(`DEBUG: API JSON响应:`, result);
        
        // 检查数据结构
        if (result.data) {
          console.log(`DEBUG: 响应包含data字段，类型: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`);
          if (Array.isArray(result.data)) {
            console.log(`DEBUG: 数组长度: ${result.data.length}`);
          }
        } else {
          console.log(`DEBUG: 响应不包含data字段!`);
        }
        
        if (DEBUG_MODE) {
          console.log(`API响应: ${method} ${url}`, result);
        }
        
        return {
          success: response.ok,
          data: result.data,
          message: result.message,
          error: !response.ok ? result.error || response.statusText : undefined
        };
      } else {
        const text = await response.text();
        
        if (DEBUG_MODE) {
          console.log(`API响应(文本): ${method} ${url}`, text);
        }
        
        return {
          success: response.ok,
          data: text as unknown as T,
          error: !response.ok ? response.statusText : undefined
        };
      }
    } catch (error) {
      console.error('API请求错误:', error);
      
      // 如果是网络错误且还有重试次数，则重试
      if (retryCount < API_CONFIG.retryAttempts && 
          (error instanceof TypeError || error instanceof DOMException)) {
        console.log(`网络错误，${API_CONFIG.retryDelay}ms后重试...`);
        await this.delay(API_CONFIG.retryDelay);
        return this.request<T>(endpoint, method, data, retryCount + 1);
      }
      
      if (DEBUG_MODE) {
        console.error(`API请求失败: ${method} ${endpoint}`, error);
      }
      
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