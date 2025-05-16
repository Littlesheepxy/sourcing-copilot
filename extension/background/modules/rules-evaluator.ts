/**
 * 规则评估器模块
 * 整合简单规则引擎，提供统一的评估接口
 */

import { SimpleRulesEngine, SimpleRulesConfig, SimpleEvaluationResult } from '../../../shared/core/rules-engine/simple-rules-engine';
import { CandidateData } from '../../../shared/types';

/**
 * 规则评估器类
 */
export class RulesEvaluator {
  private engine: SimpleRulesEngine;
  private config: SimpleRulesConfig | null = null;
  
  constructor() {
    this.engine = new SimpleRulesEngine();
    this.loadConfig();
  }
  
  /**
   * 加载规则配置
   */
  private loadConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 尝试从存储中加载简化规则配置
        chrome.storage.local.get(['simpleRulesConfig'], (result) => {
          if (result.simpleRulesConfig) {
            this.config = result.simpleRulesConfig;
            console.log('从存储中加载了简化规则配置');
            resolve();
            return;
          }
          
          // 使用默认配置
          this.config = this.engine.createDefaultConfig();
          console.log('使用默认规则配置');
          resolve();
        });
      } catch (error) {
        console.error('加载规则配置失败:', error);
        this.config = this.engine.createDefaultConfig();
        reject(error);
      }
    });
  }
  
  /**
   * 获取当前规则配置
   */
  public async getConfig(): Promise<SimpleRulesConfig> {
    if (!this.config) {
      console.log('配置尚未加载，正在加载...');
      await this.loadConfig();
    }
    
    // 确保返回的配置中自动模式始终启用
    if (this.config) {
      this.config.autoMode = true;
    }
    
    return this.config!;
  }
  
  /**
   * 保存规则配置
   * @param config 规则配置
   */
  public async saveConfig(config: SimpleRulesConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 更新内部配置
        this.config = config;
        
        // 保存到存储
        chrome.storage.local.set({ simpleRulesConfig: config }, () => {
          console.log('规则配置已保存到存储');
          
          // 同时保存到规则历史中
          this.saveToRuleHistory(config);
          
          resolve();
        });
      } catch (error) {
        console.error('保存规则配置失败:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 保存规则到历史记录
   * @param config 规则配置
   */
  private saveToRuleHistory(config: SimpleRulesConfig): void {
    chrome.storage.local.get(['ruleHistory'], (result) => {
      let history = result.ruleHistory || [];
      
      // 确保配置中的自动模式为true
      const configCopy = JSON.parse(JSON.stringify(config));
      configCopy.autoMode = true;
      
      // 创建历史记录项
      const historyItem = {
        id: Date.now().toString(),
        name: `配置 ${new Date().toLocaleString()}`,
        timestamp: Date.now(),
        config: configCopy
      };
      
      // 最多保存10条历史记录
      history.unshift(historyItem);
      if (history.length > 10) {
        history = history.slice(0, 10);
      }
      
      // 保存到存储
      chrome.storage.local.set({ ruleHistory: history }, () => {
        console.log('规则历史记录已保存');
      });
    });
  }
  
  /**
   * 评估候选人
   * @param candidate 候选人数据
   */
  public async evaluateCandidate(candidate: CandidateData): Promise<SimpleEvaluationResult> {
    if (!this.config) {
      await this.loadConfig();
    }
    
    // 使用简单规则引擎评估
    return this.engine.evaluateCandidate(candidate, this.config!);
  }
}

// 导出单例实例
export const rulesEvaluator = new RulesEvaluator(); 