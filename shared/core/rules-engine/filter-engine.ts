/**
 * 优化的规则引擎实现 - 支持按权重评分
 */
import Fuse from 'fuse.js';
import { 
  Rule, 
  RuleType, 
  FilterConfig, 
  FilterResult,
  Company,
  CompanyType
} from '../../types';

export interface CandidateData {
  id: string;
  name: string;
  position: string;
  company: string;
  skills: string[];
  education: string;
  school: string;
  experience: string;
  [key: string]: any;
}

export class FilterEngine {
  private config: FilterConfig;
  private keywordsFuse: Fuse<string>;
  
  constructor(config: FilterConfig) {
    this.config = config;
    
    // 初始化Fuse.js用于模糊匹配
    this.keywordsFuse = new Fuse(this.config.keywords, {
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true
    });
  }
  
  /**
   * 筛选候选人
   * @param candidate 候选人数据
   * @returns 筛选结果
   */
  evaluateCandidate(candidate: CandidateData): FilterResult {
    // 对规则按顺序排序
    const sortedRules = [...this.config.rules]
      .filter(rule => rule.enabled)
      .sort((a, b) => a.order - b.order);
    
    // 按顺序评估规则
    let totalScore = 0;
    let totalWeight = 0;
    
    // 收集匹配详情
    const matchDetails: FilterResult['matchDetails'] = [];
    
    // 首先检查岗位是否匹配（硬条件）
    const positionRule = sortedRules.find(r => r.type === RuleType.POSITION);
    if (positionRule) {
      const positionMatched = this.checkPositionMatch(candidate.position, this.config.positionKeywords);
      
      // 如果岗位不匹配且是硬条件，则直接拒绝
      if (!positionMatched) {
        matchDetails.push({
          ruleId: positionRule.id,
          ruleName: positionRule.name,
          matched: false,
          score: 0,
          details: '岗位不匹配（硬性条件）'
        });
        
        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          score: 0,
          matchDetails,
          action: 'skip',
          timestamp: Date.now()
        };
      }
      
      // 岗位匹配，记录得分
      matchDetails.push({
        ruleId: positionRule.id,
        ruleName: positionRule.name,
        matched: true,
        score: positionRule.weight,
        details: '岗位匹配'
      });
      
      totalScore += positionRule.weight;
      totalWeight += positionRule.weight;
    }
    
    // 评估其他规则
    for (const rule of sortedRules) {
      // 跳过已评估的岗位规则
      if (rule.type === RuleType.POSITION) continue;
      
      let matched = false;
      let score = 0;
      let details = '';
      
      switch (rule.type) {
        case RuleType.COMPANY:
          const companyResult = this.evaluateCompanyRule(rule, candidate);
          matched = companyResult.matched;
          score = companyResult.score;
          details = companyResult.details;
          break;
          
        case RuleType.KEYWORD:
          const keywordResult = this.evaluateKeywordRule(rule, candidate);
          matched = keywordResult.matched;
          score = keywordResult.score;
          details = keywordResult.details;
          break;
          
        case RuleType.SCHOOL:
          matched = this.checkSchoolMatch(candidate.school, rule.items || []);
          score = matched ? rule.weight : 0;
          details = matched ? '学校匹配' : '学校不匹配';
          break;
          
        case RuleType.EDUCATION:
          matched = this.checkEducationMatch(candidate.education, rule.items || []);
          score = matched ? rule.weight : 0;
          details = matched ? '学历匹配' : '学历不匹配';
          break;
      }
      
      // 记录匹配详情
      matchDetails.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched,
        score,
        details
      });
      
      totalScore += score;
      totalWeight += rule.weight;
    }
    
    // 计算最终得分（百分比）
    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    // 决定行动
    let action: FilterResult['action'] = 'skip';
    if (this.config.mode === 'auto') {
      // 自动模式下，根据阈值决定是否打招呼
      action = finalScore >= this.config.autoGreetThreshold ? 'greet' : 'skip';
    } else {
      // 人工校准模式
      action = 'manual';
    }
    
    return {
      candidateId: candidate.id,
      candidateName: candidate.name,
      score: Math.round(finalScore),
      matchDetails,
      action,
      timestamp: Date.now()
    };
  }
  
  /**
   * 检查岗位是否匹配
   */
  private checkPositionMatch(position: string, keywords: string[]): boolean {
    if (!position || !keywords.length) return false;
    
    const normalizedPosition = position.toLowerCase();
    return keywords.some(keyword => 
      normalizedPosition.includes(keyword.toLowerCase())
    );
  }
  
  /**
   * 评估公司规则
   */
  private evaluateCompanyRule(rule: Rule, candidate: CandidateData): 
    { matched: boolean; score: number; details: string } {
    if (!candidate.company) {
      return { matched: false, score: 0, details: '无公司信息' };
    }
    
    // 查找候选人公司是否在列表中
    const normalizedCompany = candidate.company.toLowerCase();
    const matchedCompany = this.config.companies.find(company => 
      normalizedCompany.includes(company.name.toLowerCase())
    );
    
    if (!matchedCompany) {
      return { matched: false, score: 0, details: '公司不在列表中' };
    }
    
    // 根据公司类型计算得分
    let matchedDetails = '';
    let scoreMultiplier = 1.0;
    
    switch (matchedCompany.type) {
      case CompanyType.COMPETITOR:
        // 对于竞争对手，需要关键词匹配度更高
        matchedDetails = `竞对公司：${matchedCompany.name}`;
        // 需要检查关键词匹配度是否达到阈值
        const keywordRules = this.config.rules.filter(r => 
          r.type === RuleType.KEYWORD && r.enabled
        );
        
        if (keywordRules.length > 0) {
          // 计算关键词匹配的平均分
          let keywordScore = 0;
          for (const keywordRule of keywordRules) {
            const result = this.evaluateKeywordRule(keywordRule, candidate);
            keywordScore += result.score / keywordRule.weight;
          }
          keywordScore = keywordScore / keywordRules.length;
          
          // 如果关键词匹配度低于阈值，降低得分
          const keywordThreshold = rule.threshold || 0.5;
          if (keywordScore < keywordThreshold) {
            scoreMultiplier = keywordScore / keywordThreshold;
            matchedDetails += `，但关键词匹配度低于阈值`;
          }
        }
        break;
        
      case CompanyType.TARGET:
        // 目标公司，高权重
        matchedDetails = `目标公司：${matchedCompany.name}`;
        scoreMultiplier = 1.0;
        break;
        
      case CompanyType.NORMAL:
        // 普通公司
        matchedDetails = `普通公司：${matchedCompany.name}`;
        scoreMultiplier = 0.7;
        break;
    }
    
    const score = rule.weight * scoreMultiplier;
    
    return { 
      matched: true, 
      score, 
      details: matchedDetails 
    };
  }
  
  /**
   * 评估关键词规则
   */
  private evaluateKeywordRule(rule: Rule, candidate: CandidateData): 
    { matched: boolean; score: number; details: string } {
    // 从候选人数据中提取技能和经验描述
    const skillTexts = candidate.skills || [];
    const experienceText = candidate.experience || '';
    
    // 如果没有相关信息，则直接返回不匹配
    if (!skillTexts.length && !experienceText) {
      return { matched: false, score: 0, details: '无技能或经验信息' };
    }
    
    // 整合所有文本
    const allText = [...skillTexts, experienceText].join(' ').toLowerCase();
    
    // 使用Fuse.js进行模糊匹配
    const matchedKeywords: string[] = [];
    
    // 对每个关键词进行检查
    for (const keyword of this.config.keywords) {
      if (allText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        continue;
      }
      
      // 模糊匹配
      const result = this.keywordsFuse.search(keyword);
      if (result.length && result[0].score && result[0].score < 0.4) {
        matchedKeywords.push(keyword);
      }
    }
    
    // 计算匹配率
    const matchRate = this.config.keywords.length > 0 
      ? matchedKeywords.length / this.config.keywords.length 
      : 0;
    
    // 根据匹配率计算得分
    const score = rule.weight * matchRate;
    
    // 详细信息
    const details = matchedKeywords.length > 0
      ? `匹配关键词：${matchedKeywords.join(', ')} (${Math.round(matchRate * 100)}%)`
      : '无匹配关键词';
    
    return {
      matched: matchedKeywords.length > 0,
      score,
      details
    };
  }
  
  /**
   * 检查学校是否匹配
   */
  private checkSchoolMatch(school: string, targetSchools: string[]): boolean {
    if (!school || !targetSchools.length) return false;
    
    const normalizedSchool = school.toLowerCase();
    return targetSchools.some(targetSchool => 
      normalizedSchool.includes(targetSchool.toLowerCase())
    );
  }
  
  /**
   * 检查学历是否匹配
   */
  private checkEducationMatch(education: string, targetEducations: string[]): boolean {
    if (!education || !targetEducations.length) return false;
    
    const normalizedEducation = education.toLowerCase();
    return targetEducations.some(targetEducation => 
      normalizedEducation.includes(targetEducation.toLowerCase())
    );
  }
  
  /**
   * 更新筛选配置
   * @param config 新的筛选配置
   */
  updateConfig(config: FilterConfig): void {
    this.config = config;
    
    // 更新Fuse.js实例
    this.keywordsFuse = new Fuse(this.config.keywords, {
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true
    });
  }
} 