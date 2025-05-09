/**
 * 简化规则引擎连接器
 * 用于将简化规则引擎集成到扩展插件中
 */

import { SimpleRulesEngine, SimpleRulesConfig, CandidateData, SimpleEvaluationResult } from '../../shared/core/rules-engine/simple-rules-engine';
import { SimpleRulesAdapter } from '../../shared/core/rules-engine/simple-adapter';
import { UnifiedRuleGroup, RuleGroup } from '../../shared/core/rules-engine/types';

// 简化规则引擎连接器
export class SimpleRulesConnector {
  private engine: SimpleRulesEngine;
  private adapter: SimpleRulesAdapter;
  private config: SimpleRulesConfig | null = null;
  
  constructor() {
    this.engine = new SimpleRulesEngine();
    this.adapter = new SimpleRulesAdapter();
    this.loadConfig();
    this.setupMessageListeners();
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
            resolve();
            return;
          }
          
          // 尝试加载统一规则并转换
          chrome.storage.local.get(['unified_rules'], (unifiedResult) => {
            if (unifiedResult.unified_rules) {
              const parsedUnifiedRules = JSON.parse(unifiedResult.unified_rules) as UnifiedRuleGroup;
              this.config = this.adapter.convertToSimpleRules(parsedUnifiedRules);
              resolve();
              return;
            }
            
            // 尝试加载旧版逻辑规则并转换(通过统一规则)
            chrome.storage.local.get(['rules'], (rulesResult) => {
              if (rulesResult.rules) {
                const parsedRules = JSON.parse(rulesResult.rules) as RuleGroup;
                // 这里需要先将旧规则转换为统一规则格式
                // 后续实现
                this.config = this.engine.createDefaultConfig();
                resolve();
                return;
              }
              
              // 使用默认配置
              this.config = this.engine.createDefaultConfig();
              resolve();
            });
          });
        });
      } catch (error) {
        console.error('加载规则配置失败:', error);
        this.config = this.engine.createDefaultConfig();
        reject(error);
      }
    });
  }
  
  /**
   * 保存规则配置
   */
  public saveConfig(config: SimpleRulesConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 确保自动模式始终为true
        config.autoMode = true;
        
        this.config = config;
        
        // 保存简化规则配置
        chrome.storage.local.set({
          simpleRulesConfig: config
        }, () => {
          // 转换并保存统一规则格式
          const unifiedRules = this.adapter.convertToUnifiedRules(config);
          chrome.storage.local.set({
            unified_rules: JSON.stringify(unifiedRules)
          }, () => {
            // 转换并保存旧版逻辑规则格式(兼容旧版)
            const logicRules = this.adapter.convertToLogicRules(config);
            chrome.storage.local.set({
              rules: JSON.stringify(logicRules)
            }, () => {
              console.log('规则配置保存成功');
              resolve();
            });
          });
        });
      } catch (error) {
        console.error('保存规则配置失败:', error);
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
    
    console.log('返回当前配置:', this.config);
    return this.config!;
  }
  
  /**
   * 评估候选人
   */
  public async evaluateCandidate(candidate: CandidateData): Promise<SimpleEvaluationResult> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.engine.evaluateCandidate(candidate, this.config!);
  }

  /**
   * 设置消息监听器
   * 用于处理来自UI的消息
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('收到消息:', message.type);
      
      // 处理获取简单规则配置请求
      if (message.type === 'getSimpleRulesConfig') {
        this.getConfig().then(config => {
          console.log('发送规则配置响应:', config);
          sendResponse({ success: true, config });
        }).catch(error => {
          console.error('获取规则配置失败:', error);
          sendResponse({ 
            success: false, 
            error: error.message || '获取规则配置失败' 
          });
        });
        return true; // 保持消息通道开放，用于异步响应
      }
      
      // 处理保存简单规则配置请求
      if (message.type === 'saveSimpleRulesConfig' && message.config) {
        console.log('保存规则配置:', message.config);
        this.saveConfig(message.config).then(() => {
          console.log('规则保存成功');
          sendResponse({ success: true });
        }).catch(error => {
          console.error('保存规则失败:', error);
          sendResponse({ 
            success: false, 
            error: error.message || '保存规则配置失败' 
          });
        });
        return true; // 保持消息通道开放，用于异步响应
      }
      
      // 处理评估候选人请求
      if (message.type === 'evaluateCandidate' && message.candidate) {
        this.evaluateCandidate(message.candidate).then(result => {
          sendResponse({ success: true, result });
        }).catch(error => {
          sendResponse({ 
            success: false, 
            error: error.message || '评估候选人失败' 
          });
        });
        return true; // 保持消息通道开放，用于异步响应
      }
    });
  }
}

// 导出单例实例
export const simpleRulesConnector = new SimpleRulesConnector(); 