/**
 * 日志服务 - 记录筛选操作和结果
 */
import { FilterConfig, FilterResult } from '../../types';

export interface LogEntry {
  id: string;
  timestamp: number;
  filterConfigId: string;
  filterConfigName: string;
  result: FilterResult;
  actionTaken: string;
  metadata?: Record<string, any>;
}

export interface LoggerOptions {
  maxEntries?: number;
  storageKey?: string;
  onSave?: (entries: LogEntry[]) => void;
}

export class Logger {
  private entries: LogEntry[] = [];
  private options: LoggerOptions;
  
  constructor(options: LoggerOptions = {}) {
    this.options = {
      maxEntries: 1000,
      storageKey: 'sourcing_bot_logs',
      ...options
    };
    
    // 尝试从存储中加载日志
    this.loadLogs();
  }
  
  /**
   * 记录筛选结果
   * @param config 筛选配置
   * @param result 筛选结果
   * @param actionTaken 执行的操作
   * @param metadata 额外元数据
   */
  log(
    config: FilterConfig,
    result: FilterResult,
    actionTaken: string,
    metadata?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      filterConfigId: config.id,
      filterConfigName: config.name,
      result,
      actionTaken,
      metadata
    };
    
    // 添加到日志集合
    this.entries.unshift(entry);
    
    // 如果超过最大条目数，删除旧条目
    if (this.entries.length > (this.options.maxEntries || 1000)) {
      this.entries = this.entries.slice(0, this.options.maxEntries);
    }
    
    // 保存日志
    this.saveLogs();
    
    return entry;
  }
  
  /**
   * 获取所有日志条目
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }
  
  /**
   * 按配置ID过滤日志
   * @param configId 配置ID
   */
  getEntriesByConfig(configId: string): LogEntry[] {
    return this.entries.filter(entry => entry.filterConfigId === configId);
  }
  
  /**
   * 按时间范围过滤日志
   * @param startTime 开始时间
   * @param endTime 结束时间
   */
  getEntriesByTimeRange(startTime: number, endTime: number): LogEntry[] {
    return this.entries.filter(
      entry => entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }
  
  /**
   * 清除所有日志
   */
  clearLogs(): void {
    this.entries = [];
    this.saveLogs();
  }
  
  /**
   * 导出日志为JSON字符串
   */
  exportLogs(): string {
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
        this.saveLogs();
      }
    } catch (error) {
      console.error('导入日志失败', error);
    }
  }
  
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * 保存日志到存储
   */
  private saveLogs(): void {
    try {
      // 使用自定义保存回调
      if (this.options.onSave) {
        this.options.onSave(this.entries);
        return;
      }
      
      // 保存到localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          this.options.storageKey || 'sourcing_bot_logs',
          JSON.stringify(this.entries)
        );
      }
    } catch (error) {
      console.error('保存日志失败', error);
    }
  }
  
  /**
   * 从存储加载日志
   */
  private loadLogs(): void {
    try {
      // 从localStorage加载
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.options.storageKey || 'sourcing_bot_logs');
        if (stored) {
          this.entries = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('加载日志失败', error);
      this.entries = [];
    }
  }
} 