/**
 * DeepSeek AI服务实现
 * 集成DeepSeek API，用于生成规则建议
 */
import { AIRecommendation, CalibrationRecord, Rule, RuleType } from '../../types';

interface DeepSeekConfig {
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
}

interface PromptData {
  position: string;
  calibrationRecords?: CalibrationRecord[];
  existingRules?: Rule[];
}

export class DeepSeekService {
  private config: DeepSeekConfig;
  
  constructor(config: DeepSeekConfig) {
    this.config = config;
  }
  
  /**
   * 根据岗位和历史记录生成规则建议
   * @param data 提示数据
   * @returns AI推荐
   */
  async generateRecommendation(data: PromptData): Promise<AIRecommendation> {
    try {
      // 构建提示
      const prompt = this.buildPrompt(data);
      
      // 调用DeepSeek API
      const response = await this.callDeepSeekAPI(prompt);
      
      // 解析结果
      return this.parseResponse(response);
    } catch (error) {
      console.error('DeepSeek API调用失败', error);
      throw new Error('AI推荐生成失败');
    }
  }
  
  /**
   * 构建提示模板
   * @param data 提示数据
   * @returns 格式化的提示文本
   */
  private buildPrompt(data: PromptData): string {
    const { position, calibrationRecords, existingRules } = data;
    
    let prompt = `作为招聘筛选专家，请为Boss直聘上的"${position}"岗位生成筛选规则建议。
规则涉及以下几个方面：
1. 规则权重和优先顺序
2. 推荐的目标公司和竞对公司列表
3. 关键技能关键词列表

`;
    
    // 添加现有规则信息
    if (existingRules && existingRules.length > 0) {
      prompt += `当前的规则配置如下：\n`;
      
      existingRules.forEach(rule => {
        prompt += `- ${rule.name}：权重 ${rule.weight}，顺序 ${rule.order}\n`;
        if (rule.items && rule.items.length > 0) {
          prompt += `  项目：${rule.items.join(', ')}\n`;
        }
      });
      
      prompt += `\n`;
    }
    
    // 添加校准记录
    if (calibrationRecords && calibrationRecords.length > 0) {
      prompt += `根据以下用户校准记录，优化规则配置：\n`;
      
      // 仅展示部分校准数据，避免prompt过长
      const sampleRecords = calibrationRecords.slice(0, 5);
      
      sampleRecords.forEach(record => {
        const candidate = record.candidateData;
        prompt += `- ${record.userDecision === 'accept' ? '接受' : '拒绝'} 候选人：`;
        prompt += `${candidate.name}，`;
        prompt += `公司：${candidate.company}，`;
        prompt += `岗位：${candidate.position}，`;
        prompt += `技能：${Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills}\n`;
      });
      
      prompt += `\n`;
    }
    
    prompt += `请以JSON格式提供以下建议：
1. 规则顺序和权重推荐（规则包括：岗位、公司、关键词、学校、学历）
2. 为此岗位推荐的目标公司和竞争对手公司列表
3. 为此岗位推荐的关键技能关键词列表
4. 一段简短的解释，说明推荐理由

仅返回JSON格式数据，无需其他解释。`;
    
    return prompt;
  }
  
  /**
   * 调用DeepSeek API
   * @param prompt 提示文本
   * @returns API响应文本
   */
  private async callDeepSeekAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`DeepSeek API请求失败：${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用错误', error);
      throw error;
    }
  }
  
  /**
   * 解析API响应
   * @param response API响应文本
   * @returns 解析后的AI推荐
   */
  private parseResponse(response: string): AIRecommendation {
    try {
      // 从回复中提取JSON部分
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/) || 
                        response.match(/({[\s\S]*?})/);
      
      let jsonString = jsonMatch ? jsonMatch[1] : response;
      
      // 解析JSON
      const parsed = JSON.parse(jsonString);
      
      // 转换为AIRecommendation格式
      const recommendation: AIRecommendation = {
        rules: [],
        companies: [],
        keywords: [],
        explanation: parsed.explanation || ''
      };
      
      // 处理规则
      if (parsed.rules && Array.isArray(parsed.rules)) {
        recommendation.rules = parsed.rules.map((rule: any) => ({
          type: this.mapRuleType(rule.type),
          name: rule.name || this.getRuleTypeName(this.mapRuleType(rule.type)),
          weight: rule.weight || 50,
          order: rule.order || 0
        }));
      }
      
      // 处理公司
      if (parsed.companies && Array.isArray(parsed.companies)) {
        recommendation.companies = parsed.companies;
      }
      
      // 处理关键词
      if (parsed.keywords && Array.isArray(parsed.keywords)) {
        recommendation.keywords = parsed.keywords;
      }
      
      return recommendation;
    } catch (error) {
      console.error('解析DeepSeek响应失败', error);
      // 返回空推荐
      return {
        rules: [],
        companies: [],
        keywords: [],
        explanation: '无法解析AI响应'
      };
    }
  }
  
  /**
   * 映射规则类型
   */
  private mapRuleType(type: string): RuleType {
    const typeMap: Record<string, RuleType> = {
      'position': RuleType.POSITION,
      'company': RuleType.COMPANY,
      'keyword': RuleType.KEYWORD,
      'school': RuleType.SCHOOL,
      'education': RuleType.EDUCATION
    };
    
    return typeMap[type.toLowerCase()] || RuleType.KEYWORD;
  }
  
  /**
   * 获取规则类型名称
   */
  private getRuleTypeName(type: RuleType): string {
    const nameMap: Record<RuleType, string> = {
      [RuleType.POSITION]: '岗位',
      [RuleType.COMPANY]: '公司',
      [RuleType.KEYWORD]: '关键词',
      [RuleType.SCHOOL]: '学校',
      [RuleType.EDUCATION]: '学历'
    };
    
    return nameMap[type] || '未知规则';
  }
} 