"use client";

/**
 * 日志服务 - 记录操作和结果，包括展示给用户的数据
 */

import { getApiService, OperationLog } from './api-service';

// 日志条目接口 - 更新为候选人分组格式
export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  data?: any; // 用于存储展示给用户的数据
}

// 候选人日志分组接口
export interface CandidateLogGroup {
  candidate_id: string;
  candidate_name: string;
  candidate_position: string;
  candidate_company: string;
  final_action: string;
  latest_timestamp: string | Date;
  ai_evaluation?: {
    score: number;
    passed: boolean;
    reason: string;
    highlights?: string[];
    concerns?: string[];
  };
  operations: {
    id: string;
    timestamp: string;
    action: string;
    details: string;
    metadata?: any;
  }[];
}

// 日志服务选项
export interface LogServiceOptions {
  maxEntries?: number;
  storageKey?: string;
  useLocalStorage?: boolean; // 是否使用本地存储作为备份
  useApi?: boolean; // 是否使用API
}

// 默认选项
const DEFAULT_OPTIONS: LogServiceOptions = {
  maxEntries: 1000,
  storageKey: 'sourcing_bot_logs',
  useLocalStorage: true,
  useApi: true
};

/**
 * 日志服务
 * 负责记录操作日志和展示给用户的数据
 */
export class LogService {
  private entries: LogEntry[] = [];
  private options: LogServiceOptions;
  private isLoading: boolean = false;
  
  constructor(options: LogServiceOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.loadLogs();
  }
  
  /**
   * 记录一个操作日志
   * @param action 操作类型
   * @param details 详细信息
   * @param data 展示给用户的数据（可选）
   * @returns 新的日志条目
   */
  async log(action: string, details: string, data?: any): Promise<LogEntry> {
    // 创建本地日志条目
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action,
      details: this.optimizeLogMessage(details), // 优化日志消息
      data: this.sanitizeData(data) // 处理数据，移除敏感信息和不必要的详细信息
    };
    
    // 添加到日志集合
    this.entries.unshift(entry);
    
    // 如果超过最大条目数，删除旧条目
    if (this.entries.length > (this.options.maxEntries || 1000)) {
      this.entries = this.entries.slice(0, this.options.maxEntries);
    }
    
    // 保存日志
    if (this.options.useLocalStorage) {
      this.saveToLocalStorage();
    }
    
    // 如果启用API，则发送到后端
    if (this.options.useApi) {
      try {
        const apiService = getApiService();
        await apiService.addLog({
          timestamp: entry.timestamp,
          action: entry.action,
          details: entry.details,
          dataType: data ? typeof data : undefined,
          dataId: data?.id,
          metadata: data ? { summary: this.generateDataSummary(data) } : undefined
        });
      } catch (error) {
        console.error('发送日志到API失败:', error);
      }
    }
    
    return entry;
  }
  
  /**
   * 优化日志消息，使其更简洁、更易于用户理解
   */
  private optimizeLogMessage(message: string): string {
    if (!message) return '';
    
    // 移除时间戳和冗余信息
    let optimized = message
      .replace(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/g, '')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s{2,}/g, ' ');
    
    // 移除常见的技术术语和冗余前缀
    optimized = optimized
      .replace(/Error: /g, '')
      .replace(/Exception: /g, '')
      .replace(/INFO: /g, '')
      .replace(/WARNING: /g, '')
      .replace(/DEBUG: /g, '')
      .replace(/TRACE: /g, '');
    
    // 用更友好的表述替换技术术语
    optimized = optimized
      .replace(/failed to connect/i, '连接失败')
      .replace(/timeout/i, '操作超时')
      .replace(/undefined/i, '数据未定义')
      .replace(/null/i, '数据为空');
    
    // 如果消息过长，进行截断
    if (optimized.length > 200) {
      optimized = optimized.substring(0, 197) + '...';
    }
    
    return optimized;
  }
  
  /**
   * 处理数据，移除敏感信息和不必要的详细信息
   */
  private sanitizeData(data: any): any {
    if (!data) return undefined;
    
    // 创建数据副本，避免修改原始数据
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // 移除敏感字段
    if (typeof sanitized === 'object') {
      // 移除通用敏感字段
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) sanitized[field] = '[已隐藏]';
      });
      
      // 压缩大型字段，保留摘要
      const largeFields = ['rawHtml', 'fullText', 'rawData'];
      largeFields.forEach(field => {
        if (sanitized[field] && typeof sanitized[field] === 'string' && sanitized[field].length > 100) {
          sanitized[field] = `${sanitized[field].substring(0, 100)}... [已省略${sanitized[field].length - 100}字符]`;
        }
      });
    }
    
    return sanitized;
  }
  
  /**
   * 生成数据摘要
   */
  private generateDataSummary(data: any): any {
    if (!data) return undefined;
    
    if (typeof data === 'object') {
      const summary: Record<string, any> = {};
      
      // 提取关键字段作为摘要
      const keyFields = ['id', 'name', 'title', 'type', 'status', 'createdAt', 'updatedAt'];
      keyFields.forEach(field => {
        if (data[field] !== undefined) summary[field] = data[field];
      });
      
      // 对于候选人数据，提取重要的基本信息
      if (data.education || data.experience || data.company || data.school || data.position) {
        summary.basicInfo = {
          education: data.education,
          experience: data.experience,
          company: data.company,
          school: data.school,
          position: data.position
        };
      }
      
      return summary;
    }
    
    return data;
  }
  
  /**
   * 获取所有日志条目 - 返回候选人分组格式
   */
  async getEntries(): Promise<CandidateLogGroup[]> {
    // 如果启用API，则从API获取日志
    if (this.options.useApi) {
      try {
        const apiService = getApiService();
        const response = await apiService.getLogs();
        
        if (response.success && Array.isArray(response.data)) {
          // API返回的已经是分组格式，直接返回
          return response.data.map((group: any): CandidateLogGroup => ({
            candidate_id: group.candidate_id,
            candidate_name: group.candidate_name,
            candidate_position: group.candidate_position,
            candidate_company: group.candidate_company,
            final_action: group.final_action,
            latest_timestamp: group.latest_timestamp,
            ai_evaluation: group.ai_evaluation,
            operations: group.operations || []
          }));
        }
      } catch (error) {
        console.error('从API获取日志失败，使用本地日志', error);
      }
    }
    
    // 如果API失败，将本地日志转换为分组格式
    return this.convertToGroupedFormat(this.entries);
  }

  /**
   * 将传统日志格式转换为候选人分组格式
   */
  private convertToGroupedFormat(entries: LogEntry[]): CandidateLogGroup[] {
    const groups: { [key: string]: CandidateLogGroup } = {};
    
    entries.forEach(entry => {
      const candidateId = entry.data?.candidateId || entry.data?.id || `unknown_${entry.id}`;
      const candidateName = entry.data?.name || entry.data?.candidate_name || '未知候选人';
      
      if (!groups[candidateId]) {
        groups[candidateId] = {
          candidate_id: candidateId,
          candidate_name: candidateName,
          candidate_position: entry.data?.position || '未知',
          candidate_company: entry.data?.company || '未知',
          final_action: entry.action,
          latest_timestamp: entry.timestamp,
          ai_evaluation: entry.data?.ai_evaluation,
          operations: []
        };
      }
      
      groups[candidateId].operations.push({
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action,
        details: entry.details,
        metadata: entry.data
      });
      
      // 更新最新时间戳和最终操作
      if (new Date(entry.timestamp) > new Date(groups[candidateId].latest_timestamp)) {
        groups[candidateId].latest_timestamp = entry.timestamp;
        groups[candidateId].final_action = entry.action;
      }
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.latest_timestamp).getTime() - new Date(a.latest_timestamp).getTime()
    );
  }
  
  /**
   * 按类型过滤日志
   * @param actionType 操作类型
   */
  getEntriesByAction(actionType: string): LogEntry[] {
    return this.entries.filter(entry => entry.action === actionType);
  }
  
  /**
   * 清除所有日志
   */
  async clearLogs(): Promise<void> {
    this.entries = [];
    
    // 清除本地存储
    if (this.options.useLocalStorage) {
      this.saveToLocalStorage();
    }
    
    // 如果启用API，则调用API清除日志
    if (this.options.useApi) {
      try {
        const apiService = getApiService();
        await apiService.clearLogs();
      } catch (error) {
        console.error('通过API清除日志失败:', error);
      }
    }
  }
  
  /**
   * 导出日志为JSON字符串
   */
  async exportLogs(): Promise<string> {
    // 如果启用API，则通过API导出日志
    if (this.options.useApi) {
      try {
        const apiService = getApiService();
        const response = await apiService.exportLogs();
        if (response.success && typeof response.data === 'string') {
          return response.data;
        }
      } catch (error) {
        console.error('通过API导出日志失败:', error);
      }
    }
    
    // 如果API调用失败或未启用API，则使用本地日志
    return JSON.stringify(this.entries);
  }
  
  /**
   * 导入日志
   * @param jsonStr JSON字符串
   */
  importLogs(jsonStr: string): void {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        this.entries = parsed;
        
        // 保存到本地存储
        if (this.options.useLocalStorage) {
          this.saveToLocalStorage();
        }
      }
    } catch (error) {
      console.error('导入日志失败', error);
    }
  }
  
  /**
   * 从API刷新日志
   */
  private async refreshLogsFromApi(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    try {
      const apiService = getApiService();
      const response = await apiService.getLogs();
      
      if (response.success) {
        // 尝试处理不同格式的API响应
        let logData: OperationLog[] = [];
        
        if (Array.isArray(response.data)) {
          logData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // 使用类型断言避免TypeScript错误
          const responseObj = response.data as Record<string, any>;
          if ('data' in responseObj && Array.isArray(responseObj.data)) {
            logData = responseObj.data;
          } else {
            console.log('日志数据为空或格式不支持', response);
            return;
          }
        } else {
          console.log('日志数据为空或格式不支持', response);
          return;
        }
        
        // 转换API日志格式为本地日志格式
        const apiLogs = logData.map((log: OperationLog): LogEntry => ({
          id: log.id,
          timestamp: log.timestamp,
          action: log.action,
          details: log.details,
          data: log.metadata
        }));
        
        // 更新本地日志
        this.entries = apiLogs;
        
        // 更新本地存储
        if (this.options.useLocalStorage) {
          this.saveToLocalStorage();
        }
      }
    } catch (error) {
      console.error('从API刷新日志失败:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 保存日志到本地存储
   */
  private saveToLocalStorage(): void {
    if (!this.options.useLocalStorage) return;
    
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          this.options.storageKey || 'sourcing_bot_logs',
          JSON.stringify(this.entries)
        );
      }
    } catch (error) {
      console.error('保存日志到本地存储失败', error);
    }
  }
  
  /**
   * 从存储加载日志
   */
  private async loadLogs(): Promise<void> {
    // 首先尝试从API加载
    if (this.options.useApi) {
      try {
        await this.refreshLogsFromApi();
        return; // 如果成功从API加载，则不需要从本地存储加载
      } catch (error) {
        console.error('从API加载日志失败，尝试从本地存储加载', error);
      }
    }
    
    // 如果API加载失败或未启用API，则从本地存储加载
    if (this.options.useLocalStorage) {
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem(this.options.storageKey || 'sourcing_bot_logs');
          if (stored) {
            this.entries = JSON.parse(stored);
          }
        }
      } catch (error) {
        console.error('从本地存储加载日志失败', error);
        this.entries = [];
      }
    }
  }
}

// 创建单例实例
let logServiceInstance: LogService | null = null;

/**
 * 获取日志服务实例
 */
export function getLogService(): LogService {
  if (!logServiceInstance) {
    logServiceInstance = new LogService();
  }
  return logServiceInstance;
} 