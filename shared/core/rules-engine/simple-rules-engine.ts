/**
 * Boss直聘Sourcing智能助手 - 简化规则引擎
 * 基于Fuse.js的模糊搜索能力，实现简单直观的规则筛选
 */

import Fuse from 'fuse.js';
import { v4 as uuidv4 } from 'uuid';

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
}

/**
 * 整体规则配置
 */
export interface SimpleRulesConfig {
  rules: SimpleRule[];                   // 规则列表
  passScore: number;                     // 通过分数(0-100)，仅适用于岗位核心关键词
  autoMode: boolean;                     // 自动模式
}

/**
 * 候选人数据结构
 */
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
          order: 2
        }
      ],
      passScore: 60,
      autoMode: false
    };
  }
  
  /**
   * 创建新规则
   */
  public createRule(type: SimpleRuleType, keywords: string[] = [], importance: ImportanceLevel = ImportanceLevel.一般, mustMatch: boolean = false, order: number = 0): SimpleRule {
    return {
      id: uuidv4(),
      type,
      keywords,
      importance,
      mustMatch,
      enabled: true,
      order
    };
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

    // 分类规则
    const positionRules = activeRules.filter(r => r.type === SimpleRuleType.岗位);
    const companyRules = activeRules.filter(r => r.type === SimpleRuleType.公司);
    const keywordRules = activeRules.filter(r => r.type === SimpleRuleType.岗位核心关键词);
    const otherRules = activeRules.filter(r => 
      r.type !== SimpleRuleType.岗位 && 
      r.type !== SimpleRuleType.公司 && 
      r.type !== SimpleRuleType.岗位核心关键词);
    
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
      
      if (!matched.matched) {
        // 必须条件不满足
        result.failedMustMatchRule = rule.type;
        result.passed = false;
        result.action = "skip";
        result.rejectReason = `必须条件不满足: ${rule.type}`;
        return result;
      }
    }
    
    // 第一层：岗位匹配评估
    let positionMatched = false;
    
    for (const rule of positionRules) {
      const matched = this.matchRule(candidate, rule);
      result.details.push({
        ruleType: rule.type,
        matched: matched.matched,
        keywords: rule.keywords,
        matchedKeywords: matched.matchedKeywords,
        importance: rule.importance,
        order: rule.order
      });
      
      if (matched.matched) {
        positionMatched = true;
      }
    }
    
    result.stageResult.positionMatched = positionMatched;
    
    // 如果岗位不匹配，则终止评估
    if (!positionMatched) {
      result.passed = false;
      result.action = "skip";
      result.rejectReason = "岗位不匹配";
      return result;
    }
    
    // 第二层：公司筛查评估
    let isCompetitorCompany = false;
    
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
      
      if (matched.matched) {
        isCompetitorCompany = true;
      }
    }
    
    result.stageResult.competitorCompany = isCompetitorCompany;
    
    // 如果是竞争对手公司，直接通过
    if (isCompetitorCompany) {
      result.passed = true;
      result.action = config.autoMode ? "greet" : "manual";
      // 即使直接通过，我们也计算一下关键词得分，但不影响结果
      calculateKeywordScore();
      return result;
    }
    
    // 第三层：岗位核心关键词评估
    calculateKeywordScore();
    
    // 根据关键词得分决定是否通过
    const keywordPassed = result.score >= config.passScore;
    result.stageResult.keywordPassed = keywordPassed;
    
    // 设置最终通过状态
    result.passed = keywordPassed;
    result.action = config.autoMode ? (result.passed ? "greet" : "skip") : "manual";
    
    if (!keywordPassed) {
      result.rejectReason = `岗位核心关键词得分不足: ${result.score}/${config.passScore}`;
    }
    
    // 计算其他规则（学校、学历等）但不影响通过状态，只是记录详情
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
    
    return result;
    
    // 内部函数：计算岗位核心关键词得分
    function calculateKeywordScore() {
      let matchCount = 0;
      let totalKeywords = 0;
      
      for (const rule of keywordRules) {
        const matched = this.matchRule(candidate, rule);
        result.details.push({
          ruleType: rule.type,
          matched: matched.matched,
          keywords: rule.keywords,
          matchedKeywords: matched.matchedKeywords,
          importance: rule.importance,
          order: rule.order
        });
        
        if (matched.matchedKeywords) {
          matchCount += matched.matchedKeywords.length;
        }
        
        totalKeywords += rule.keywords.length;
      }
      
      // 计算得分(0-100)
      const score = totalKeywords > 0 
        ? Math.round((matchCount / totalKeywords) * 100)
        : 0;
      
      result.score = score;
      result.stageResult.keywordScore = score;
    }
  }
  
  /**
   * 匹配单条规则
   */
  private matchRule(candidate: CandidateData, rule: SimpleRule): { matched: boolean, matchedKeywords: string[] } {
    let fieldValue: any;
    let matched = false;
    let matchedKeywords: string[] = [];
    
    // 根据规则类型获取相应字段值
    switch (rule.type) {
      case SimpleRuleType.岗位:
        fieldValue = candidate.position || '';
        break;
      case SimpleRuleType.公司:
        fieldValue = candidate.company || [];
        break;
      case SimpleRuleType.岗位核心关键词:
        fieldValue = candidate.skills || [];
        break;
      case SimpleRuleType.学校:
        fieldValue = candidate.schools || [];
        break;
      case SimpleRuleType.学历:
        fieldValue = candidate.education || '';
        break;
    }
    
    // 使用Fuse.js进行模糊匹配
    if (fieldValue) {
      // 将字段值转为数组
      const fieldValues = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
      
      // 遍历所有关键词
      for (const keyword of rule.keywords) {
        // 使用Fuse.js搜索
        const fuse = new Fuse(fieldValues, {
          includeScore: true,
          threshold: 0.4, // 匹配阈值
          ignoreLocation: true
        });
        
        const searchResult = fuse.search(keyword);
        
        // 有匹配结果
        if (searchResult.length > 0) {
          matched = true;
          matchedKeywords.push(keyword);
        }
      }
    }
    
    return { matched, matchedKeywords };
  }
} 