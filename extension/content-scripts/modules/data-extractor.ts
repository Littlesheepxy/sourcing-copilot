/**
 * 数据提取模块
 * 负责从页面提取简历数据
 */

/**
 * 从卡片提取简历数据
 * @param card 简历卡片元素
 * @param selectors 选择器配置
 */
export function extractResumeCardData(card: Element, selectors: any): any {
  const data: any = {
    id: generateCardId(card)
  };
  
  try {
    // 提取姓名
    data.name = extractElementText(card, [
      selectors.name,
      '.name', 
      '.candidate-name', 
      '.geek-name',
      'h3.name',
      '[class*="name"]'
    ]);
    
    // 提取期望职位
    data.position = extractElementText(card, [
      '.expect-position',
      '.position-expectation',
      '.job-expectation',
      '.position-name'
    ]);
    
    // 提取当前/上一家公司
    data.company = extractElementText(card, [
      selectors.company,
      '.company', 
      '.work-exp', 
      '.company-name', 
      '[class*="company"]'
    ]);
    
    // 如果公司是字符串,转成数组(保持和后端评估接口一致)
    if (typeof data.company === 'string' && data.company) {
      data.company = [data.company];
    } else if (!data.company) {
      data.company = [];
    }
    
    // 提取教育信息
    data.education = extractElementText(card, [
      selectors.education,
      '.education',
      '.edu-exp'
    ]);
    
    // 提取学校
    data.schools = [];
    const school = extractElementText(card, [
      selectors.school,
      '.school', 
      '.edu-exp-box .text', 
      '[class*="school"]'
    ]);
    if (school) {
      data.schools.push(school);
    }
    
    // 提取工作经验
    const expText = extractElementText(card, ['.experience', '[class*="experience"]']);
    if (expText) {
      const expMatch = expText.match(/(\d+)[年|-]经验/);
      if (expMatch) {
        data.experience = parseInt(expMatch[1]);
      }
    }
    
    // 提取技能标签
    data.skills = extractElementsText(card, [
      selectors.skills,
      '.tag-list', 
      '.skill-tag', 
      '.tags', 
      '.labels',
      '[class*="tag"]',
      '[class*="skill"]'
    ]);
    
    // 提取完整文本用于备用匹配
    data.fullText = card.textContent?.trim().replace(/\s+/g, ' ') || '';
    
  } catch (error) {
    console.error('提取简历卡片数据失败:', error);
  }
  
  return data;
}

/**
 * 从详情页提取简历数据
 * @param selectors 选择器配置
 */
export function extractDetailPageData(selectors: any): any {
  const data: any = {};
  
  try {
    // 提取姓名
    data.name = extractElementText(document, [
      selectors.name,
      '.name',
      '.candidate-name'
    ]);
    
    // 提取工作经历
    const workExpText = extractElementText(document, [
      selectors.detailPage.workExperience,
      '.work-exp-box'
    ]);
    if (workExpText) {
      data.workExperience = workExpText;
      
      // 从工作经历中提取公司
      const companies = extractElementsText(document, [
        '.work-exp-box .company',
        '.work-exp-box .text strong',
        '.work-exp-box [class*="company"]'
      ]);
      if (companies.length > 0) {
        data.company = companies;
      }
    }
    
    // 提取教育经历
    data.educationExperience = extractElementText(document, [
      selectors.detailPage.educationExperience,
      '.edu-exp-box'
    ]);
    
    // 从教育经历中提取学校
    const schools = extractElementsText(document, [
      '.edu-exp-box .school',
      '.edu-exp-box .text strong',
      '.edu-exp-box [class*="school"]'
    ]);
    if (schools.length > 0) {
      data.schools = schools;
    }
    
    // 提取项目经历
    data.projectExperience = extractElementText(document, [
      selectors.detailPage.projectExperience,
      '.project-exp-box'
    ]);
    
    // 提取期望
    const expectationText = extractElementText(document, [
      selectors.detailPage.expectation,
      '.expect-box'
    ]);
    if (expectationText) {
      data.expectation = expectationText;
      
      // 从期望中提取期望职位
      const positionMatch = expectationText.match(/期望职位[：:]\s*([^\n]+)/);
      if (positionMatch && positionMatch[1]) {
        data.position = positionMatch[1].trim();
      }
    }
    
    // 提取技能标签
    data.skills = extractElementsText(document, [
      '.skill-tag-box .tag-item',
      '.skill-list .tag-item',
      '[class*="skill"] [class*="tag"]'
    ]);
    
  } catch (error) {
    console.error('提取详情页数据失败:', error);
  }
  
  return data;
}

/**
 * 合并卡片数据和详情页数据
 * @param cardData 卡片数据
 * @param detailData 详情页数据
 */
export function mergeResumeData(cardData: any, detailData: any): any {
  const mergedData = { ...cardData };
  
  // 合并详情页数据，优先使用详情页中的更详细信息
  Object.entries(detailData).forEach(([key, value]) => {
    // 数组类型的数据需要合并去重
    if (Array.isArray(value) && Array.isArray(mergedData[key])) {
      mergedData[key] = [...new Set([...mergedData[key], ...value])];
    }
    // 对于有值的字段，优先使用详情页数据
    else if (value) {
      mergedData[key] = value;
    }
  });
  
  return mergedData;
}

// 辅助函数：从多个选择器中提取第一个匹配元素的文本
function extractElementText(element: Element | Document, selectors: string[]): string {
  for (const selector of selectors) {
    try {
      const selected = element.querySelector(selector);
      if (selected && selected.textContent) {
        return selected.textContent.trim();
      }
    } catch (e) {
      // 忽略选择器错误，继续尝试下一个
      continue;
    }
  }
  return '';
}

// 辅助函数：从多个选择器中提取所有匹配元素的文本数组
function extractElementsText(element: Element | Document, selectors: string[]): string[] {
  for (const selector of selectors) {
    try {
      const selected = element.querySelectorAll(selector);
      if (selected.length > 0) {
        return Array.from(selected)
          .map(el => el.textContent?.trim())
          .filter((text): text is string => !!text);
      }
    } catch (e) {
      // 忽略选择器错误，继续尝试下一个
      continue;
    }
  }
  return [];
}

// 辅助函数：为卡片生成唯一ID
function generateCardId(card: Element): string {
  // 尝试从卡片中提取内置ID
  const dataId = card.getAttribute('data-id') || card.getAttribute('data-key') || card.id;
  if (dataId) return dataId;
  
  // 使用卡片内容生成ID
  const nameElement = card.querySelector('.name, .title, [class*="name"], [class*="title"]');
  const name = nameElement ? nameElement.textContent?.trim() : '';
  
  const positionElement = card.querySelector('.position, [class*="position"]');
  const position = positionElement ? positionElement.textContent?.trim() : '';
  
  // 使用时间戳和随机数保证唯一性
  const randomPart = Math.random().toString(36).substring(2, 8);
  const timestamp = Date.now().toString(36);
  
  return `card-${name}-${position}-${timestamp}-${randomPart}`.replace(/\s+/g, '-');
} 