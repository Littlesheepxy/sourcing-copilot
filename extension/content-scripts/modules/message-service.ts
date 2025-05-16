/**
 * 消息服务模块
 * 负责与后台通信和记录日志
 */

/**
 * 发送消息到后台脚本
 * @param type 消息类型
 * @param data 消息数据
 */
export function sendMessageToBackground(type: string, data: any = {}): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...data }, (response) => {
      resolve(response);
    });
  });
}

/**
 * 向后台发送评估简历请求
 * @param resumeData 简历数据
 * @param operationId 操作ID
 */
export async function evaluateResume(resumeData: any, operationId?: string): Promise<any> {
  try {
    const evalId = operationId || `eval-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
    console.log(`[${evalId}] 发送评估简历请求`, resumeData);
    
    // 发送消息给后台脚本，使用规则引擎评估
    let retries = 0;
    const maxRetries = 3;
    let response = null;
    
    while (retries < maxRetries) {
      try {
        response = await sendMessageToBackground('evaluateResume', {
          resumeData: resumeData,
          useSimpleRules: true,  // 使用简化规则引擎
          evalId: evalId         // 传递评估ID用于跟踪
        });
        
        if (response) break; // 成功获取响应，退出重试循环
      } catch (retryError) {
        console.error(`规则引擎评估重试 ${retries + 1}/${maxRetries} 失败:`, retryError);
      }
      
      retries++;
      // 如果还有更多重试次数，则等待一会再试
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`[${evalId}] 规则引擎评估结果:`, response);
    
    let result = {
      result: false,
      reason: '规则引擎未返回有效结果',
      score: 0,
      threshold: 60
    };
    
    if (response && response.result !== undefined) {
      // 根据评估结果构建返回对象
      result = {
        result: response.result,
        engineType: response.engineType || 'simple'
      } as any;
      
      // 如果是简化规则引擎，可能会返回更多信息
      if (response.engineType === 'simple' && response.details) {
        result = {
          ...result,
          score: response.details.score,
          threshold: response.details.threshold,
          reason: response.details.reason
        };
      }
      
      // 如果没有详细信息但有理由
      if (response.reason) {
        result = {
          ...result,
          reason: response.reason
        };
      }
      
      // 如果完全没有详细信息
      if (!result.reason) {
        result = {
          ...result,
          reason: result.result ? '符合规则要求' : '不符合规则要求',
          score: result.score !== undefined ? result.score : (result.result ? 100 : 0), // 默认分数
          threshold: result.threshold !== undefined ? result.threshold : 60 // 默认阈值
        };
      }
    } else if (response && response.error) {
      console.error(`规则引擎评估出错 [${evalId}]:`, response.error);
      result = { 
        result: false, 
        reason: response.error,
        score: 0,
        threshold: 60
      };
    } else {
      console.error(`规则引擎返回未知响应 [${evalId}]:`, response);
    }
    
    return result;
  } catch (error) {
    console.error('调用规则引擎失败:', error);
    return { 
      result: false, 
      reason: `调用规则引擎失败: ${error.message}`,
      score: 0,
      threshold: 60
    };
  }
}

/**
 * 获取当前配置
 */
export async function getCurrentConfig(): Promise<any> {
  try {
    // 从后台获取配置
    const response = await sendMessageToBackground('getSimpleRulesConfig');
    if (response && response.config) {
      return response.config;
    }
    throw new Error('获取配置失败');
  } catch (error) {
    console.error('获取当前配置失败:', error);
    throw error;
  }
}

/**
 * 获取选择器配置
 */
export async function getSelectors(): Promise<any> {
  try {
    const response = await sendMessageToBackground('getSelectors');
    if (response && response.selectors) {
      return response.selectors;
    }
    throw new Error('获取选择器配置失败');
  } catch (error) {
    console.error('获取选择器配置失败:', error);
    throw error;
  }
}

/**
 * 获取当前模式
 */
export async function getMode(): Promise<string> {
  try {
    const response = await sendMessageToBackground('getMode');
    if (response && response.mode) {
      return response.mode;
    }
    return 'automatic'; // 默认为自动模式
  } catch (error) {
    console.error('获取当前模式失败:', error);
    return 'automatic'; // 出错时默认为自动模式
  }
}

/**
 * 添加日志并确保显示在侧边栏
 * @param content 日志内容
 * @param logType 日志类型: 'info', 'success', 'warning', 'error'
 * @param operationId 操作ID
 */
export async function addLogToSidebar(content: string, logType: string = 'info', operationId?: string): Promise<void> {
  try {
    // 清理内容，去除冗余信息
    let cleanContent = content
      .replace(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/g, '')
      .replace(/^\s+|\s+$/g, ''); // 修剪前后空白
    
    // 添加操作ID（如果提供）
    if (operationId) {
      cleanContent = `${cleanContent} [操作ID:${operationId}]`;
    }
    
    // 格式化日志时间
    const timeString = new Date().toLocaleTimeString();
    const displayMessage = `${timeString}\n${cleanContent}`;
    
    // 发送消息到侧边栏
    await sendMessageToBackground('addLog', {
      content: displayMessage,
      logType: logType,
      operationId: operationId, 
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('添加日志到侧边栏失败:', error);
  }
}

/**
 * 更新页面状态
 */
export function updatePageStatus(): void {
  try {
    // 导入页面检测器
    const { isRecommendListPage, isResumeDetailPage } = require('./page-detector');
    
    const status = {
      isRecommendPage: isRecommendListPage()
    };
    
    // 发送状态信息给后台脚本，再由后台脚本转发给侧边栏
    chrome.runtime.sendMessage({ 
      type: 'updatePageStatus', 
      status 
    });
    
    console.log('页面状态已更新:', status);
  } catch (error) {
    console.error('更新页面状态失败:', error);
  }
} 