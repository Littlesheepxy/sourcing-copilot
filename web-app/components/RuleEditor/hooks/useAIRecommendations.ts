import { useState } from 'react';
import { ChatMessage } from '../panels/AIAssistantChat';

interface UseAIRecommendationsProps {
  position: string;
  onAddChatMessage: (message: ChatMessage) => void;
}

export const useAIRecommendations = ({ position, onAddChatMessage }: UseAIRecommendationsProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // 调用OpenAI API的通用函数
  const callOpenAI = async (prompt: string): Promise<string> => {
    const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-hra-zp-2025052091';
    const BASE_URL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://chat.inhyperloop.com/v1';
    
    console.log('🤖 调用OpenAI API:', BASE_URL);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的人力资源专家和招聘顾问，善于分析职位需求和推荐优质公司。请用中文回答。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API调用失败:', response.status, errorText);
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('API响应格式错误:', data);
      throw new Error('API响应格式错误');
    }

    const result = data.choices[0].message.content;
    console.log('✅ OpenAI API调用成功，响应长度:', result.length);
    return result;
  };

  // AI推荐职位
  const recommendPositions = async () => {
    if (!position) {
      alert('请先输入一个基础职位关键词');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `请根据用户输入的职位"${position}"，推荐10个相关的具体职位名称。
要求：
1. 推荐的职位应该与输入职位相关或相似
2. 包含不同级别（初级、中级、高级）的职位
3. 可以包含不同方向或分支的职位
4. 职位名称要具体明确，便于招聘使用

请以JSON数组格式返回，例如：["前端开发工程师", "高级前端工程师", "前端架构师", "React开发工程师", "前端技术专家"]

只返回JSON数组，不要包含其他说明文字。`;

      const response = await callOpenAI(prompt);
      console.log('AI推荐职位原始响应:', response);
      
      let positions: string[] = [];
      try {
        // 尝试解析JSON
        const cleanResponse = response.trim().replace(/```json\s*/, '').replace(/```\s*$/, '');
        positions = JSON.parse(cleanResponse);
      } catch (jsonError) {
        console.log('JSON解析失败，尝试从文本中提取职位...');
        // 如果不是JSON格式，尝试从文本中提取职位
        const lines = response.split('\n').filter(line => line.trim());
        positions = lines
          .filter(line => line.includes('工程师') || line.includes('经理') || line.includes('专员') || line.includes('总监') || line.includes('架构师'))
          .map(line => line.replace(/^\d+\.?\s*/, '').replace(/[""'']/g, '').trim())
          .slice(0, 5);
      }
      
      if (!Array.isArray(positions) || positions.length === 0) {
        throw new Error('AI推荐返回的职位格式不正确');
      }
      
      // 添加AI推荐消息到聊天
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎯 基于"${position}"，我为您推荐了以下相关职位：\n${positions.map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`,
        timestamp: new Date(),
        suggestions: positions.map((p: string) => `选择职位：${p}`)
      };
      onAddChatMessage(newMessage);
      
    } catch (error) {
      console.error('AI推荐职位失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ AI推荐职位失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      };
      onAddChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // AI推荐公司
  const recommendCompanies = async () => {
    if (!position) {
      alert('请先输入目标职位以获得更精准的公司推荐');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `请根据职位"${position}"，推荐10个相关的优质公司名称。
要求：
1. 推荐的公司应该经常招聘该类型职位
2. 包含不同规模的公司（大厂、独角兽、创业公司等）
3. 以国内公司为主，也可包含知名外企
4. 公司名称要准确，使用常见简称

请以JSON数组格式返回，例如：["阿里", "腾讯", "字节跳动", "美团", "小米", "华为", "百度", "京东", "网易", "滴滴"]

只返回JSON数组，不要包含其他说明文字。`;

      const response = await callOpenAI(prompt);
      console.log('AI推荐公司原始响应:', response);
      
      let companies: string[] = [];
      try {
        // 尝试解析JSON
        const cleanResponse = response.trim().replace(/```json\s*/, '').replace(/```\s*$/, '');
        companies = JSON.parse(cleanResponse);
      } catch (jsonError) {
        console.log('JSON解析失败，尝试从文本中提取公司...');
        // 如果不是JSON格式，尝试从文本中提取公司名
        const lines = response.split('\n').filter(line => line.trim());
        companies = lines
          .map(line => line.replace(/^\d+\.?\s*/, '').replace(/[""'']/g, '').trim())
          .filter(line => line.length > 0 && line.length < 20) // 过滤掉过长的文本
          .slice(0, 10);
      }
      
      if (!Array.isArray(companies) || companies.length === 0) {
        throw new Error('AI推荐返回的公司格式不正确');
      }
      
      // 添加AI推荐消息到聊天
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🏢 基于"${position}"职位，我为您推荐了以下优质公司：\n${companies.map((c: string, i: number) => `${i+1}. ${c}`).join('\n')}`,
        timestamp: new Date(),
        suggestions: companies.slice(0, 5).map((c: string) => `添加公司：${c}`)
      };
      onAddChatMessage(newMessage);
      
    } catch (error) {
      console.error('AI推荐公司失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ AI推荐公司失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      };
      onAddChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    recommendPositions,
    recommendCompanies,
    callOpenAI
  };
}; 