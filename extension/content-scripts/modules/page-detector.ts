/**
 * 页面检测器模块
 * 负责检测当前页面类型
 */

/**
 * 检查是否是推荐列表页
 */
export function isRecommendListPage(): boolean {
  const url = window.location.href;
  
  // 扩展匹配范围，增加更多可能的URL模式
  return (
    url.includes('zhipin.com/web/chat/recommend') ||
    url.includes('zhipin.com/boss/recommend')
  );
}

/**
 * 检查是否是简历详情页
 */
export function isResumeDetailPage(): boolean {
  const url = window.location.href;
  return (
    url.includes('zhipin.com/geek/new/resumeDetail') ||
    url.includes('zhipin.com/web/geek/detail')
  );
}

/**
 * 获取当前页面类型
 */
export function getCurrentPageType(): 'recommend' | 'detail' | 'unknown' {
  if (isRecommendListPage()) {
    return 'recommend';
  } else if (isResumeDetailPage()) {
    return 'detail';
  } else {
    return 'unknown';
  }
} 