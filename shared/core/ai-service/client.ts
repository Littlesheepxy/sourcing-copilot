/**
 * AI服务客户端实现
 */
import {
  AIConfig,
  AIService,
  Message,
  MessageRole,
  ResumeAnalysisResult
} from './types';

/**
 * AI服务客户端
 * 负责与AI API交互
 */
export class AIServiceClient implements AIService {
  /**
   * 配置对象
   */
  private config: AIConfig;
  
  /**
   * 构造函数
   * @param config AI配置
   */
  constructor(config: AIConfig) {
    this.config = config;
  }
  
  /**
   * 发送消息并获取回复
   * @param messages 消息历史
   * @returns 回复内容
   */
  async sendMessage(messages: Message[]): Promise<string> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`API请求失败: ${response.status} ${errorData ? JSON.stringify(errorData) : response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('AI服务调用失败:', error);
      throw new Error(`AI服务调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 发送消息并获取流式回复
   * @param messages 消息历史
   * @param onChunk 收到数据块时的回调函数
   * @returns Promise<string> 完整的回复内容
   */
  async sendMessageStream(
    messages: Message[], 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`API请求失败: ${response.status} ${errorData ? JSON.stringify(errorData) : response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                return fullContent;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理下一行
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullContent;
    } catch (error) {
      console.error('AI流式服务调用失败:', error);
      throw new Error(`AI流式服务调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 分析简历
   * @param resumeData 简历数据
   * @returns 分析结果
   */
  async analyzeResume(resumeData: any): Promise<ResumeAnalysisResult> {
    const prompt = this.buildResumeAnalysisPrompt(resumeData);
    
    const systemMessage: Message = {
      role: MessageRole.SYSTEM,
      content: `你是Boss直聘的简历分析专家，请根据给定的JD和简历数据分析候选人与职位的匹配度。
      分析结果需要包含：
      1. 匹配度百分比(0-100)
      2. 关键词列表
      3. 详细分析
      请以JSON格式返回，格式为：{"matching": 数字, "keywords": ["关键词1", "关键词2", ...], "analysis": "详细分析文本"}。`
    };
    
    const userMessage: Message = {
      role: MessageRole.USER,
      content: prompt
    };
    
    const response = await this.sendMessage([systemMessage, userMessage]);
    
    try {
      // 尝试从回复中提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          matching: result.matching || 0,
          keywords: result.keywords || [],
          analysis: result.analysis || ''
        };
      }
      
      // 如果无法解析JSON，返回默认值
      return {
        matching: 0,
        keywords: [],
        analysis: response
      };
    } catch (error) {
      console.error('解析AI分析结果失败:', error);
      return {
        matching: 0,
        keywords: [],
        analysis: response
      };
    }
  }
  
  /**
   * 构建简历分析提示
   * @param resumeData 简历数据
   * @returns 提示文本
   */
  private buildResumeAnalysisPrompt(resumeData: any): string {
    const { jd, resume } = resumeData;
    
    let prompt = `请分析以下候选人与JD的匹配度:\n\n`;
    
    if (jd) {
      prompt += `## 职位需求:\n${jd}\n\n`;
    }
    
    prompt += `## 候选人信息:\n`;
    
    if (resume.basicInfo) {
      const { name, age, education, workYears, title, phone, email } = resume.basicInfo;
      prompt += `姓名: ${name || '未知'}\n`;
      prompt += `年龄: ${age || '未知'}\n`;
      prompt += `学历: ${education || '未知'}\n`;
      prompt += `工作年限: ${workYears || '未知'}\n`;
      prompt += `当前职位: ${title || '未知'}\n`;
      prompt += `联系方式: ${phone || '未知'}\n`;
      prompt += `邮箱: ${email || '未知'}\n\n`;
    }
    
    if (resume.workExperience && resume.workExperience.length > 0) {
      prompt += `## 工作经历:\n`;
      resume.workExperience.forEach((exp: any, index: number) => {
        prompt += `### 经历 ${index + 1}:\n`;
        prompt += `公司: ${exp.company || '未知'}\n`;
        prompt += `职位: ${exp.title || '未知'}\n`;
        prompt += `时间: ${exp.timeRange || '未知'}\n`;
        prompt += `描述: ${exp.description || '无描述'}\n\n`;
      });
    }
    
    if (resume.projects && resume.projects.length > 0) {
      prompt += `## 项目经历:\n`;
      resume.projects.forEach((proj: any, index: number) => {
        prompt += `### 项目 ${index + 1}:\n`;
        prompt += `名称: ${proj.name || '未知'}\n`;
        prompt += `角色: ${proj.role || '未知'}\n`;
        prompt += `时间: ${proj.timeRange || '未知'}\n`;
        prompt += `描述: ${proj.description || '无描述'}\n\n`;
      });
    }
    
    if (resume.skills && resume.skills.length > 0) {
      prompt += `## 技能:\n${resume.skills.join(', ')}\n\n`;
    }
    
    prompt += `请分析这位候选人与职位的匹配程度，并返回JSON格式的分析结果。`;
    
    return prompt;
  }
  
  /**
   * 更新配置
   * @param newConfig 新配置
   */
  updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
} 