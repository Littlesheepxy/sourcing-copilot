/**
 * AI服务类型定义
 */

/**
 * AI配置
 */
export interface AIConfig {
  /**
   * API密钥
   */
  apiKey: string;
  
  /**
   * API基础URL
   */
  apiBaseUrl: string;
  
  /**
   * 模型名称
   */
  modelName: string;
  
  /**
   * 温度参数，控制创造性
   */
  temperature: number;
  
  /**
   * 最大输出标记数
   */
  maxTokens: number;
}

/**
 * 消息角色
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant'
}

/**
 * 消息对象
 */
export interface Message {
  /**
   * 消息角色
   */
  role: MessageRole;
  
  /**
   * 消息内容
   */
  content: string;
}

/**
 * 简历分析结果
 */
export interface ResumeAnalysisResult {
  /**
   * 匹配度，0-100
   */
  matching: number;
  
  /**
   * 关键词列表
   */
  keywords: string[];
  
  /**
   * 分析文本
   */
  analysis: string;
}

/**
 * AI服务接口
 */
export interface AIService {
  /**
   * 发送消息并获取回复
   * @param messages 消息历史
   * @returns 回复内容
   */
  sendMessage(messages: Message[]): Promise<string>;
  
  /**
   * 分析简历
   * @param resumeData 简历数据
   * @returns 分析结果
   */
  analyzeResume(resumeData: any): Promise<ResumeAnalysisResult>;
} 