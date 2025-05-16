/**
 * 简历处理模块
 * 负责处理简历卡片和详情页的核心业务逻辑
 */

import { simulateMouseMovement, showSuccessNotification, showErrorNotification, getRandomDelay, closeDetailDialog, scrollPage } from './ui-actions';
import { addLogToSidebar, evaluateResume } from './message-service';
import { findGreetButton, findDetailElement, waitForElement } from './element-finder';
import { extractResumeCardData, extractDetailPageData, mergeResumeData } from './data-extractor';

// 处理配置
const CONFIG = {
  SCROLL_INTERVAL: 2, // 处理几条简历后滚动页面
  SCROLL_DISTANCE: 300, // 每次滚动的距离(像素)
  MIN_DELAY: 1500, // 最小延迟时间(毫秒)
  MAX_DELAY: 3000, // 最大延迟时间(毫秒)
};

// 处理状态
let isProcessing = false; // 防止重复处理
let processedCardCount = 0; // 已处理卡片计数，用于控制滚动
let needConfirmation = false; // 是否需要用户确认

/**
 * 设置处理状态
 * @param processing 是否正在处理
 * @param needConfirm 是否需要确认
 */
export function setProcessingState(processing: boolean, needConfirm: boolean = false): void {
  isProcessing = processing;
  needConfirmation = needConfirm;
  
  // 如果停止处理，重置卡片计数
  if (!processing) {
    processedCardCount = 0;
  }
}

/**
 * 获取处理状态
 */
export function getProcessingState(): { isProcessing: boolean, needConfirmation: boolean } {
  return { isProcessing, needConfirmation };
}

/**
 * 处理推荐列表页
 * @param selectors 选择器配置
 */
export async function processRecommendListPage(selectors: any): Promise<void> {
  // 检查处理状态，但不检查isProcessing - 因为调用者已设置了该状态
  console.log('处理推荐列表页 - 当前处理状态:', isProcessing);
  
  // 检查静态标记，防止同一页面重复处理
  if ((processRecommendListPage as any).pageBeingProcessed) {
    console.log('当前页面正在处理中，忽略本次请求');
    await addLogToSidebar(`当前页面已在处理中，忽略重复请求`, 'warning');
    return;
  }
  
  // 设置页面处理标记
  (processRecommendListPage as any).pageBeingProcessed = true;
  
  try {
    await addLogToSidebar(`推荐牛人任务[开始]: 正在处理推荐列表页`, 'info');
    
    // 尝试使用多种选择器来匹配推荐卡片
    let resumeCards: NodeListOf<Element> = document.querySelectorAll(selectors.resumeCard);
    await addLogToSidebar(`尝试查找推荐卡片，使用选择器: ${selectors.resumeCard}`, 'info');
    
    // 如果没有找到推荐卡片，尝试使用更通用的选择器
    if (resumeCards.length === 0) {
      await addLogToSidebar(`默认选择器未找到推荐卡片，尝试使用备选选择器`, 'warning');
      
      // 尝试使用多种可能的选择器
      const possibleSelectors = [
        '.recommend-card-wrap',                  // 原始选择器
        '.recommend-list-wrap .card',            // 可能的新选择器
        '.recommend-list .geek-card',            // 另一种可能的选择器
        '.recommend-card',                       // 简化选择器
        '[data-id="recommendCard"]',             // 数据属性选择器
        '.job-list-wrap .job-card',              // 工作卡片选择器
        '.job-card-wrapper',                     // 另一种工作卡片选择器
        '.card-inner',                           // 通用卡片内部元素
        '.candidate-list-content .candidate-card' // 候选人卡片
      ];
      
      // 尝试每一个选择器
      for (const selector of possibleSelectors) {
        const cards = document.querySelectorAll(selector);
        if (cards.length > 0) {
          await addLogToSidebar(`找到推荐卡片，使用选择器: ${selector}, 数量: ${cards.length}`, 'success');
          resumeCards = cards;
          break;
        }
      }
    }
    
    // 最后一次尝试：查找可能包含推荐内容的任何卡片元素
    if (resumeCards.length === 0) {
      await addLogToSidebar(`备选选择器未找到推荐卡片，尝试查找任何可能的卡片元素`, 'warning');
      resumeCards = document.querySelectorAll('.card, .list-item, [class*="card"], [class*="recommend"], [class*="resume"]');
    }
    
    await addLogToSidebar(`最终找到推荐卡片数量: ${resumeCards.length}`, resumeCards.length > 0 ? 'success' : 'error');
    
    if (resumeCards.length === 0) {
      await addLogToSidebar(`未找到推荐卡片，请确认当前是否在推荐列表页`, 'error');
      showErrorNotification('未找到推荐卡片，请确认当前是否在推荐列表页');
      return;
    }
    
    // 显示成功通知
    showSuccessNotification(`找到 ${resumeCards.length} 个简历卡片`);
    
    // 设置总处理数量
    const totalCards = resumeCards.length;
    const maxCandidates = 50; // 暂设置最大处理数量
    const targetCount = Math.min(totalCards, maxCandidates);
    
    // 创建已处理卡片的集合，防止重复处理
    const processedCardIds = new Set<string>();
    
    // 处理每个推荐卡片
    let processedCount = 0;
    for (let i = 0; i < resumeCards.length; i++) {
      const card = resumeCards[i];
      
      // 检查是否已停止处理
      if (!isProcessing) {
        await addLogToSidebar(`处理已中断`, 'warning');
        break;
      }
      
      // 提取卡片ID
      const cardData = extractResumeCardData(card, selectors);
      const cardId = cardData.id;
      
      // 检查是否已处理过该卡片
      if (processedCardIds.has(cardId)) {
        await addLogToSidebar(`跳过已处理过的卡片 #${i+1}`, 'info');
        continue;
      }
      
      // 标记为已处理
      processedCardIds.add(cardId);
      
      // 处理当前卡片
      await addLogToSidebar(`开始处理第 ${i+1} 个卡片 (总共 ${resumeCards.length} 个)`, 'info');
      await processResumeCard(card as Element, selectors);
      processedCount++;
      
      // 更新进度信息
      await addLogToSidebar(`当前打招呼进展: ${processedCount} / ${targetCount}`, 'info');
      
      // 如果达到目标数量，结束处理
      if (processedCount >= targetCount) {
        await addLogToSidebar(`已达到目标处理数量: ${targetCount}`, 'success');
        break;
      }
      
      // 随机延迟，模拟人工操作
      await new Promise(resolve => setTimeout(resolve, getRandomDelay(CONFIG.MIN_DELAY, CONFIG.MAX_DELAY)));
    }
    
    // 记录日志
    await addLogToSidebar(`推荐牛人任务[完成]: 成功处理 ${processedCount} 个推荐卡片`, 'success');
    
    // 显示成功通知
    showSuccessNotification('所有简历卡片处理完成');
  } catch (error) {
    console.error('处理推荐列表页失败:', error);
    
    // 记录错误日志
    await addLogToSidebar(`推荐牛人任务[错误]: ${error.message}`, 'error');
    
    // 显示错误通知
    showErrorNotification(`处理失败: ${error.message}`);
  } finally {
    // 重置处理状态
    isProcessing = false;
    
    // 处理结束后，设置超时防止短时间内重复处理
    setTimeout(() => {
      (processRecommendListPage as any).pageBeingProcessed = false;
      console.log('页面处理锁已释放，可以开始新的处理任务');
    }, 5000); // 5秒后才允许再次处理
  }
}

/**
 * 处理简历卡片
 * @param card 简历卡片元素
 * @param selectors 选择器配置
 */
export async function processResumeCard(card: Element, selectors: any): Promise<void> {
  // 生成操作ID用于跟踪整个流程
  const opNo = `c${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
  
  try {
    // 提取简历数据
    await addLogToSidebar(`开始提取候选人卡片信息`, 'info', opNo);
    const resumeData = extractResumeCardData(card, selectors);
    
    // 记录提取到的详细信息
    const candidateName = resumeData.name || '未知候选人';
    await addLogToSidebar(`获取候选人内部卡片元素成功, 候选人: [${candidateName}]`, 'info', opNo);
    
    // 使用规则引擎评估卡片数据
    await addLogToSidebar(`开始分析候选人卡片信息`, 'info', opNo);
    
    // 记录开始时间以计算分析耗时
    const analysisStartTime = Date.now();
    const initialEvalResult = await evaluateResume(resumeData, opNo);
    const analysisDuration = Date.now() - analysisStartTime;
    
    // 记录规则引擎分析结果
    const analysisDetails = [
      `结果: ${initialEvalResult.result ? '通过' : '不通过'}`,
      `分数: ${initialEvalResult.score !== undefined ? initialEvalResult.score : '未知'}`,
      `阈值: ${initialEvalResult.threshold !== undefined ? initialEvalResult.threshold : '未知'}`,
      `原因: ${initialEvalResult.reason || '未指明'}`,
      `耗时: ${analysisDuration}ms`
    ].join(' | ');
    
    const logType = initialEvalResult.result ? 'info' : 'warning';
    await addLogToSidebar(`卡片分析结果: ${analysisDetails}`, logType, opNo);
    
    // 如果初步评估不通过，跳过处理
    if (initialEvalResult.result === false) {
      await addLogToSidebar(`跳过处理: ${initialEvalResult.reason || '不符合筛选条件'}`, 'warning', opNo);
      
      // 增加处理计数并检查是否需要滚动页面
      processedCardCount++;
      await scrollPageIfNeeded();
      return;
    }
    
    // 查找打招呼按钮
    await addLogToSidebar(`开始查找打招呼按钮`, 'info', opNo);
    const greetButton = await findGreetButton(card, selectors);
    if (!greetButton) {
      await addLogToSidebar(`未找到打招呼按钮: ${candidateName}`, 'error', opNo);
      
      // 增加处理计数并检查是否需要滚动页面
      processedCardCount++;
      await scrollPageIfNeeded();
      return;
    }
    await addLogToSidebar(`找到打招呼按钮`, 'success', opNo);
    
    // 初步评估通过，但分数中等，需要查看详情页进一步分析
    if (initialEvalResult.score !== undefined && initialEvalResult.score < 85) {
      await addLogToSidebar(`初步评估通过但分数较低(${initialEvalResult.score})，准备打开详情页进一步分析`, 'info', opNo);
      await processResumeDetail(card, resumeData, selectors, opNo);
      return;
    }
    
    // 得分高，直接打招呼
    await addLogToSidebar(`初步评估得分高(${initialEvalResult.score})，直接打招呼`, 'success', opNo);
    
    // 是否需要用户确认
    if (needConfirmation) {
      await addLogToSidebar(`等待用户确认`, 'info', opNo);
      // 实现确认逻辑...
      return;
    }
    
    // 打招呼
    await addLogToSidebar(`准备向候选人[${candidateName}]打招呼`, 'info', opNo);
    await greetCandidate(greetButton, resumeData, opNo);
    await addLogToSidebar(`打招呼动作执行完毕`, 'success', opNo);
    
    // 增加处理计数并检查是否需要滚动页面
    processedCardCount++;
    await scrollPageIfNeeded();
    
  } catch (error) {
    console.error(`处理简历卡片异常 [${opNo}]:`, error);
    await addLogToSidebar(`处理简历卡片失败: ${error.message}`, 'error', opNo);
  }
}

/**
 * 处理简历详情
 * @param card 简历卡片元素
 * @param cardData 卡片数据
 * @param selectors 选择器配置
 * @param opNo 操作ID
 */
async function processResumeDetail(card: Element, cardData: any, selectors: any, opNo: string): Promise<void> {
  try {
    // 找到卡片中可点击的详情元素
    const detailElement = await findDetailElement(card);
    if (!detailElement) {
      await addLogToSidebar(`未找到详情元素: ${cardData.name || '未知'}`, 'error', opNo);
      
      // 增加处理计数并检查是否需要滚动页面
      processedCardCount++;
      await scrollPageIfNeeded();
      return;
    }
    
    // 点击详情元素，打开详情弹窗
    await addLogToSidebar(`找到详情元素，准备点击`, 'info', opNo);
    await simulateMouseMovement(detailElement);
    detailElement.click();
    
    // 等待详情弹窗加载
    await addLogToSidebar(`等待详情弹窗加载`, 'info', opNo);
    const detailContent = await waitForElement(selectors.detailPage.container, 5000);
    if (!detailContent) {
      await addLogToSidebar(`等待详情弹窗超时: ${cardData.name || '未知'}`, 'error', opNo);
      
      // 增加处理计数并检查是否需要滚动页面
      processedCardCount++;
      await scrollPageIfNeeded();
      return;
    }
    
    await addLogToSidebar(`简历弹窗加载完成`, 'info', opNo);
    await addLogToSidebar(`准备抓取候选人简历`, 'info', opNo);
    
    // 提取详情页面的数据
    await addLogToSidebar(`开始提取详情页数据`, 'info', opNo);
    const detailData = extractDetailPageData(selectors);
    
    // 合并卡片数据和详情数据
    const combinedData = mergeResumeData(cardData, detailData);
    
    // 使用规则引擎评估完整数据
    await addLogToSidebar(`开始简历详情分析`, 'info', opNo);
    
    // 记录详情分析开始时间
    const detailAnalysisStartTime = Date.now();
    const detailEvalResult = await evaluateResume(combinedData, opNo);
    const detailAnalysisDuration = Date.now() - detailAnalysisStartTime;
    
    // 记录详情匹配结果日志
    const resultStatus = detailEvalResult.result ? 'pass' : 'reject';
    const resultLogType = detailEvalResult.result ? 'success' : 'warning';
    await addLogToSidebar(`简历详情分析: 结果：${resultStatus}`, resultLogType, opNo);
    
    // 详细记录分析结果
    const detailAnalysisLog = [
      `结果: ${detailEvalResult.result ? '通过' : '不通过'}`,
      `分数: ${detailEvalResult.score !== undefined ? detailEvalResult.score : '未知'}`,
      `阈值: ${detailEvalResult.threshold !== undefined ? detailEvalResult.threshold : '未知'}`,
      `原因: ${detailEvalResult.reason || '未指明'}`,
      `耗时: ${detailAnalysisDuration}ms`
    ].join(' | ');
    
    await addLogToSidebar(`详情页分析结果: ${detailAnalysisLog}`, resultLogType, opNo);
    
    // 如果评估通过，在详情页点击打招呼按钮
    if (detailEvalResult.result) {
      await addLogToSidebar(`详情分析通过，准备打招呼`, 'success', opNo);
      const detailGreetButton = await findGreetButton(document, selectors);
      if (detailGreetButton) {
        // 是否需要用户确认
        if (needConfirmation) {
          await addLogToSidebar(`等待用户确认`, 'info', opNo);
          
          // 关闭详情弹窗
          await closeDetailDialog();
          return;
        }
        
        // 打招呼
        await addLogToSidebar(`找到详情页打招呼按钮，准备点击`, 'info', opNo);
        await greetCandidate(detailGreetButton, combinedData, opNo);
        await addLogToSidebar(`打招呼动作执行完毕`, 'success', opNo);
      } else {
        await addLogToSidebar(`在详情页未找到打招呼按钮: ${cardData.name || '未知'}`, 'error', opNo);
      }
    } else {
      await addLogToSidebar(`简历不符合筛选条件: ${detailEvalResult.reason || '未指明原因'}`, 'warning', opNo);
    }
    
    // 关闭详情弹窗
    await addLogToSidebar(`准备关闭详情弹窗`, 'info', opNo);
    await closeDetailDialog();
    await addLogToSidebar(`关闭详情弹窗完成`, 'info', opNo);
    
    // 增加处理计数并检查是否需要滚动页面
    processedCardCount++;
    await scrollPageIfNeeded();
    
  } catch (error) {
    console.error(`处理简历详情异常 [${opNo}]:`, error);
    await addLogToSidebar(`处理简历详情失败: ${error.message}`, 'error', opNo);
    
    // 尝试关闭详情弹窗
    try {
      await closeDetailDialog();
    } catch (closeError) {
      console.error('关闭详情弹窗失败:', closeError);
    }
    
    // 增加处理计数并检查是否需要滚动页面
    processedCardCount++;
    await scrollPageIfNeeded();
  }
}

/**
 * 打招呼操作
 * @param greetButton 打招呼按钮元素
 * @param resumeData 简历数据
 * @param opNo 操作ID
 */
async function greetCandidate(greetButton: HTMLElement, resumeData: any, opNo?: string): Promise<void> {
  try {
    // 模拟鼠标移动
    await simulateMouseMovement(greetButton);
    
    // 点击打招呼按钮
    greetButton.click();
    
    // 记录日志
    await addLogToSidebar(`向 ${resumeData.name || '候选人'} 发送了招呼`, 'info', opNo);
    
    // 显示成功通知
    showSuccessNotification(`已向 ${resumeData.name || '候选人'} 发送招呼`);
  } catch (error) {
    console.error('打招呼失败:', error);
    
    // 记录错误日志
    await addLogToSidebar(`向 ${resumeData.name || '候选人'} 打招呼时出错: ${error.message}`, 'error', opNo);
    
    // 显示错误通知
    showErrorNotification(`打招呼失败: ${error.message}`);
  }
}

/**
 * 处理简历详情页
 * @param selectors 选择器配置
 */
export async function processResumeDetailPage(selectors: any): Promise<void> {
  // 生成操作ID
  const operationId = `d${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
  
  try {
    console.log('开始处理简历详情页');
    
    // 记录日志
    await addLogToSidebar(`处理简历详情页`, 'info', operationId);
    
    // 提取简历详情数据
    const detailData = extractDetailPageData(selectors);
    console.log('提取到详情页数据:', detailData);
    
    // 使用规则引擎评估简历
    const evaluationResult = await evaluateResume(detailData, operationId);
    
    console.log('评估结果:', evaluationResult);
    
    // 查找打招呼按钮
    const greetButton = await findGreetButton(document, selectors);
    
    if (!greetButton) {
      await addLogToSidebar(`未找到打招呼按钮`, 'error', operationId);
      showErrorNotification('未找到打招呼按钮');
      return;
    }
    
    // 如果简历符合规则，则自动打招呼
    if (evaluationResult.result) {
      await addLogToSidebar(`简历符合规则，将自动打招呼`, 'success', operationId);
      
      // 是否需要用户确认
      if (needConfirmation) {
        await addLogToSidebar(`等待用户确认`, 'info', operationId);
        // 实现确认逻辑...
        return;
      }
      
      // 打招呼
      await greetCandidate(greetButton, detailData, operationId);
    } else {
      await addLogToSidebar(`简历不符合规则，跳过: ${evaluationResult.reason || '未指明原因'}`, 'warning', operationId);
      showErrorNotification('简历不符合筛选规则，已跳过');
    }
  } catch (error) {
    console.error('处理简历详情页失败:', error);
    
    // 记录错误日志
    await addLogToSidebar(`处理详情页失败: ${error.message}`, 'error', operationId);
    
    // 显示错误通知
    showErrorNotification(`处理失败: ${error.message}`);
  } finally {
    // 处理完成后，确保重置处理状态
    console.log('简历详情页处理完成，重置处理状态');
  }
}

/**
 * 滚动页面（如果需要）
 */
async function scrollPageIfNeeded(): Promise<void> {
  // 滚动条件：已处理卡片数量是SCROLL_INTERVAL的倍数
  if (processedCardCount > 0 && processedCardCount % CONFIG.SCROLL_INTERVAL === 0) {
    const operationId = `s${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
    console.log(`已处理 ${processedCardCount} 个简历卡片，滚动页面`);
    
    // 记录日志
    await addLogToSidebar(`滚动页面`, 'info', operationId);
    
    try {
      // 滚动页面
      const success = await scrollPage(CONFIG.SCROLL_DISTANCE);
      if (success) {
        await addLogToSidebar(`页面滚动成功`, 'success', operationId);
      } else {
        await addLogToSidebar(`页面滚动失败，但继续处理`, 'warning', operationId);
      }
    } catch (error) {
      console.error('滚动页面时出错:', error);
      await addLogToSidebar(`滚动页面失败: ${error.message}`, 'error', operationId);
    }
    
    // 无论滚动成功与否，等待一段时间再继续处理
    await new Promise(resolve => setTimeout(resolve, getRandomDelay(800, 1500)));
  }
} 