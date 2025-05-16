/**
 * 共享类型定义 - 简化版
 * 只保留简单规则引擎所需的类型
 */

// 基本的数据类型

// 候选人数据结构
export interface CandidateData {
  id: string;
  name?: string;
  position?: string;
  company?: string[];
  skills?: string[];
  schools?: string[];
  education?: string;
  experience?: number;
  [key: string]: any;
}

// 人工校准记录
export interface CalibrationRecord {
  candidateId: string;
  candidateData: any;
  userDecision: 'accept' | 'reject';
  timestamp: number;
}

// 基本筛选条件
export interface BasicFilters {
  position: string;
  companies: string[];
  keywords: string[];
}

// 规则优先级
export interface RulePriority {
  id: string;
  name: string;
  weight: number;
} 