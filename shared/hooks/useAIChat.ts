/**
 * AI聊天相关钩子
 */
import { StorageAdapter } from '../../packages/store-factory/types';
import { createPersistentStore } from '../../packages/store-factory/createStore';
import {
  AIConfig,
  Message,
  MessageRole
} from '../core/ai-service/types';
import { AIServiceClient } from '../core/ai-service/client';

/**
 * AI聊天状态
 */
interface AIChatState {
  // 配置
  config: AIConfig;
  // 消息历史
  messages: Message[];
  // 加载状态
  isLoading: boolean;
  
  // 设置配置
  setConfig: (config: Partial<AIConfig>) => void;
  
  // 发送消息
  sendMessage: (content: string) => Promise<string>;
  
  // 清空消息
  clearMessages: () => void;
  
  // 添加系统消息
  addSystemMessage: (content: string) => void;
}

/**
 * 默认AI配置
 */
const DEFAULT_CONFIG: AIConfig = {
  apiKey: '',
  apiBaseUrl: 'https://api.deepseek.com/v1',
  modelName: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 1000
};

/**
 * 默认系统提示
 */
const DEFAULT_SYSTEM_PROMPT = 
  '你是Boss直聘Sourcing智能助手，你的任务是帮助我更好地筛选和评估候选人。' +
  '你可以帮我分析简历、撰写邮件和消息、提供有关人才招聘的专业建议。' +
  '请尽量给出简洁明了的回答，如果你不确定或不知道，请直接告诉我。';

/**
 * 创建AI聊天存储
 * @param adapter 存储适配器
 * @returns AI聊天存储钩子
 */
export function createAIChatStore(adapter: StorageAdapter<any>) {
  // 创建AI聊天存储
  return createPersistentStore<AIChatState>(
    (set, get) => {
      // 创建AI服务客户端
      let client: AIServiceClient;
      
      return {
        config: { ...DEFAULT_CONFIG },
        messages: [],
        isLoading: false,
        
        // 设置配置
        setConfig: (newConfig) => {
          const updatedConfig = { ...get().config, ...newConfig };
          set({ config: updatedConfig });
          
          // 更新客户端配置
          if (client) {
            client.updateConfig(updatedConfig);
          }
        },
        
        // 发送消息
        sendMessage: async (content) => {
          // 创建或更新客户端
          if (!client) {
            client = new AIServiceClient(get().config);
          }
          
          // 创建用户消息
          const userMessage: Message = {
            role: MessageRole.USER,
            content
          };
          
          // 更新状态
          set({ 
            messages: [...get().messages, userMessage],
            isLoading: true 
          });
          
          try {
            // 准备完整的消息历史
            const allMessages = get().messages.length === 0
              ? [
                  { role: MessageRole.SYSTEM, content: DEFAULT_SYSTEM_PROMPT },
                  userMessage
                ]
              : [...get().messages];
            
            // 调用AI服务
            const response = await client.sendMessage(allMessages);
            
            // 创建助手消息
            const assistantMessage: Message = {
              role: MessageRole.ASSISTANT,
              content: response
            };
            
            // 更新状态
            set({
              messages: [...get().messages, assistantMessage],
              isLoading: false
            });
            
            return response;
          } catch (error) {
            console.error('AI聊天失败:', error);
            set({ isLoading: false });
            throw error;
          }
        },
        
        // 清空消息
        clearMessages: () => {
          set({ messages: [] });
        },
        
        // 添加系统消息
        addSystemMessage: (content) => {
          // 只允许在开始添加系统消息
          if (get().messages.length === 0) {
            set({
              messages: [
                {
                  role: MessageRole.SYSTEM,
                  content
                }
              ]
            });
          }
        }
      };
    },
    {
      adapter,
      keys: ['config', 'messages']
    }
  );
} 