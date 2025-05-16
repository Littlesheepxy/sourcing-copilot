/**
 * Boss直聘Sourcing智能助手 - 简化规则引擎
 * 基于Fuse.js的模糊搜索能力，实现简单直观的规则筛选
 */

import Fuse from 'fuse.js';
import { v4 as uuidv4 } from 'uuid';
import { CandidateData } from '../../types/index';

/**
 * 简化规则类型枚举
 */
export enum SimpleRuleType {
  岗位 = "岗位",
  公司 = "公司",
  岗位核心关键词 = "岗位核心关键词", 
  学校 = "学校",
  学历 = "学历"
}

/**
 * 重要性级别枚举
 * 保留此枚举以兼容旧代码，但在新逻辑中不再依赖此权重
 */
export enum ImportanceLevel {
  不重要 = 25,
  一般 = 50,
  重要 = 75,
  非常重要 = 100
}

/**
 * 简化后的规则结构
 */
export interface SimpleRule {
  id: string;                            // 规则唯一标识
  type: SimpleRuleType;                  // 规则类型
  keywords: string[];                    // 关键词列表
  importance: ImportanceLevel;           // 重要性(已弃用，保留此属性以兼容旧数据)
  mustMatch: boolean;                    // 必须满足
  enabled: boolean;                      // 是否启用
  order?: number;                        // 规则顺序
  passScore?: number;                    // 通过分数（仅适用于岗位核心关键词类型）
}

/**
 * 整体规则配置
 */
export interface SimpleRulesConfig {
  rules: SimpleRule[];                   // 规则列表
  passScore?: number;                    // 全局通过分数(0-100)，已弃用，改为在各规则中设置
  autoMode: boolean;                     // 自动模式
}

/**
 * 评估结果
 */
export interface SimpleEvaluationResult {
  candidateId: string;                   // 候选人ID
  candidateName?: string;                // 候选人姓名
  score: number;                         // 总分(0-100)，只计算岗位核心关键词的分数
  passed: boolean;                       // 是否通过筛选
  details: {                             // 详细结果
    ruleType: SimpleRuleType;            // 规则类型
    matched: boolean;                    // 是否匹配
    keywords: string[];                  // 关键词
    matchedKeywords?: string[];          // 匹配的关键词
    importance: ImportanceLevel;         // 重要性(旧属性)
    order?: number;                      // 规则顺序
  }[];
  failedMustMatchRule?: SimpleRuleType;  // 未通过的必须条件
  action: "greet" | "skip" | "manual";   // 建议操作
  stageResult: {                         // 各阶段评估结果
    positionMatched: boolean;            // 岗位匹配（第一层）
    competitorCompany: boolean;          // 是否竞对公司（第二层）
    keywordScore: number;                // 关键词得分（第三层）
    keywordPassed: boolean;              // 关键词是否通过
  };
  rejectReason?: string;                 // 拒绝原因
}

/**
 * 简化规则引擎
 */
export class SimpleRulesEngine {
  /**
   * 创建默认规则配置
   */
  public createDefaultConfig(): SimpleRulesConfig {
    return {
      rules: [
        // 默认岗位规则
        {
          id: uuidv4(),
          type: SimpleRuleType.岗位,
          keywords: ['前端开发', '前端工程师'],
          importance: ImportanceLevel.非常重要,
          mustMatch: true,  // 岗位必须匹配
          enabled: true,
          order: 0
        },
        // 默认公司规则
        {
          id: uuidv4(),
          type: SimpleRuleType.公司,
          keywords: ['竞品公司A', '竞品公司B'],
          importance: ImportanceLevel.非常重要,
          mustMatch: false,
          enabled: true,
          order: 1
        },
        // 默认关键词规则
        {
          id: uuidv4(),
          type: SimpleRuleType.岗位核心关键词,
          keywords: ['React', 'Vue', 'TypeScript'],
          importance: ImportanceLevel.重要,
          mustMatch: false,
          enabled: true,
          order: 2,
          passScore: 60
        }
      ],
      autoMode: false
    };
  }
  
  /**
   * 创建新规则
   */
  public createRule(type: SimpleRuleType, keywords: string[] = [], importance: ImportanceLevel = ImportanceLevel.一般, mustMatch: boolean = false, order: number = 0): SimpleRule {
    const rule: SimpleRule = {
      id: uuidv4(),
      type,
      keywords,
      importance,
      mustMatch,
      enabled: true,
      order
    };
    
    // 如果是关键词规则，添加默认通过分数
    if (type === SimpleRuleType.岗位核心关键词) {
      rule.passScore = 60;
    }
    
    return rule;
  }

  /**
   * 评估候选人
   */
  public evaluateCandidate(candidate: CandidateData, config: SimpleRulesConfig): SimpleEvaluationResult {
    // 初始化结果
    const result: SimpleEvaluationResult = {
      candidateId: candidate.id,
      candidateName: candidate.name,
      score: 0,
      passed: false,
      details: [],
      action: config.autoMode ? "manual" : "manual",
      stageResult: {
        positionMatched: false,
        competitorCompany: false,
        keywordScore: 0,
        keywordPassed: false
      }
    };

    // 按顺序排序的启用规则
    const activeRules = config.rules
      .filter(r => r.enabled)
      .sort((a, b) => {
        // 如果有order属性则按order排序，否则保持原顺序
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });

    // 检查必须匹配的规则（先检查，这是最高优先级）
    const mustMatchRules = activeRules.filter(r => r.mustMatch);
    for (const rule of mustMatchRules) {
      const matched = this.matchRule(candidate, rule);
      result.details.push({
        ruleType: rule.type,
        matched: matched.matched,
        keywords: rule.keywords,
        matchedKeywords: matched.matchedKeywords,
        importance: rule.importance,
        order: rule.order
      });
      
      // 如果必须匹配的规则未匹配，直接返回失败
      if (!matched.matched) {
        result.failedMustMatchRule = rule.type;
        result.passed = false;
        result.action = "skip";
        
        // 设置拒绝原因
        if (rule.type === SimpleRuleType.岗位) {
          result.rejectReason = "岗位不匹配";
        } else if (rule.type === SimpleRuleType.公司) {
          result.rejectReason = "公司不符合要求";
        }
        
        return result;
      }
      
      // 如果是岗位规则且匹配，标记第一阶段通过
      if (rule.type === SimpleRuleType.岗位) {
        result.stageResult.positionMatched = true;
      }
    }
    
    // 检查竞对公司规则（第二层）
    const companyRules = activeRules.filter(r => r.type === SimpleRuleType.公司 && !r.mustMatch);
    for (const rule of companyRules) {
      const matched = this.matchRule(candidate, rule);
      result.details.push({
        ruleType: rule.type,
        matched: matched.matched,
        keywords: rule.keywords,
        matchedKeywords: matched.matchedKeywords,
        importance: rule.importance,
        order: rule.order
      });
      
      // 如果匹配到了公司（竞品公司），标记第二阶段通过
      if (matched.matched) {
        result.stageResult.competitorCompany = true;
      }
    }
    
    // 检查关键词规则（第三层）
    const keywordRules = activeRules.filter(r => r.type === SimpleRuleType.岗位核心关键词);
    if (keywordRules.length > 0) {
      // 计算关键词得分
      const keywordScore = this.calculateKeywordScore(candidate, keywordRules);
      result.score = keywordScore;
      result.stageResult.keywordScore = keywordScore;
      
      // 判断关键词分数是否通过
      // 如果有多个关键词规则，使用第一个规则的通过分数
      const passScore = keywordRules[0].passScore || 60;
      result.stageResult.keywordPassed = keywordScore >= passScore;
    }
    
    // 检查其他非必须匹配的规则（补充规则）
    const otherRules = activeRules.filter(r => !r.mustMatch && r.type !== SimpleRuleType.公司 && r.type !== SimpleRuleType.岗位核心关键词);
    for (const rule of otherRules) {
      const matched = this.matchRule(candidate, rule);
      result.details.push({
        ruleType: rule.type,
        matched: matched.matched,
        keywords: rule.keywords,
        matchedKeywords: matched.matchedKeywords,
        importance: rule.importance,
        order: rule.order
      });
    }
    
    // 确定最终通过状态
    // 1. 如果必须匹配的规则已经失败，结果已经在前面返回
    // 2. 如果关键词得分达到阈值，则通过
    if (result.stageResult.keywordPassed) {
      result.passed = true;
      
      // 如果处于自动模式，直接设置为greet
      if (config.autoMode) {
        result.action = "greet";
      } else {
        result.action = "manual";
      }
    } 
    // 3. 如果关键词得分未达到阈值
    else {
      result.passed = false;
      result.action = "skip";
      
      // 设置拒绝原因
      if (result.stageResult.keywordScore > 0) {
        result.rejectReason = "技能关键词匹配度不足";
      } else {
        result.rejectReason = "无匹配的技能关键词";
      }
    }
    
    return result;
  }
  
  /**
   * 计算关键词得分
   */
  private calculateKeywordScore(candidate: CandidateData, keywordRules: SimpleRule[]): number {
    // 对于简单模式，我们只使用一个关键词规则（如果有多个，取第一个）
    if (keywordRules.length === 0) return 0;
    
    const rule = keywordRules[0];
    const result = this.matchRule(candidate, rule);
    
    // 计算匹配比例
    const totalKeywords = rule.keywords.length;
    const matchedCount = result.matchedKeywords.length;
    
    if (totalKeywords === 0) return 0;
    
    // 基于匹配比例计算得分(0-100)
    const score = Math.min(100, Math.round((matchedCount / totalKeywords) * 100));
    
    return score;
  }
  
  /**
   * 匹配单个规则
   */
  private matchRule(candidate: CandidateData, rule: SimpleRule): { matched: boolean, matchedKeywords: string[] } {
    const matchedKeywords: string[] = [];
    
    // 基于规则类型检查不同的字段
    switch (rule.type) {
      case SimpleRuleType.岗位:
        // 岗位匹配
        if (candidate.position) {
          for (const keyword of rule.keywords) {
            if (candidate.position.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
          }
        }
        break;
        
      case SimpleRuleType.公司:
        // 公司匹配
        if (candidate.company && candidate.company.length > 0) {
          for (const keyword of rule.keywords) {
            if (candidate.company.some(c => c.includes(keyword))) {
              matchedKeywords.push(keyword);
            }
          }
        }
        break;
        
      case SimpleRuleType.岗位核心关键词:
        // 关键词匹配，使用Fuse.js进行模糊匹配
        if (candidate.skills && candidate.skills.length > 0) {
          // 创建Fuse实例
          const fuse = new Fuse(candidate.skills, {
            includeScore: true,
            threshold: 0.3 // 匹配阈值，值越小越精确
          });
          
          // 对每个关键词进行模糊搜索
          for (const keyword of rule.keywords) {
            const results = fuse.search(keyword);
            if (results.length > 0) {
              matchedKeywords.push(keyword);
            }
          }
        }
        break;
        
      case SimpleRuleType.学校:
        // 学校匹配
        if (candidate.schools && candidate.schools.length > 0) {
          for (const keyword of rule.keywords) {
            if (candidate.schools.some(s => s.includes(keyword))) {
              matchedKeywords.push(keyword);
            }
          }
        }
        break;
        
      case SimpleRuleType.学历:
        // 学历匹配
        if (candidate.education) {
          for (const keyword of rule.keywords) {
            if (candidate.education.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
          }
        }
        break;
    }
    
    // 规则匹配结果：只要有一个关键词匹配就算匹配
    return {
      matched: matchedKeywords.length > 0,
      matchedKeywords
    };
  }
} 