// 模拟存储，仅用于开发环境
// 在实际生产环境中应该使用数据库

export interface LogRecord {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  dataType?: string;
  dataId?: string;
  metadata?: Record<string, any>;
}

// 导出日志数组，便于在不同路由之间共享
export const logs: LogRecord[] = []; 