/**
 * 数据转换器
 * 负责处理和规范化提取的数据
 */
export class DataTransformer {
  /**
   * 标准化学历信息
   * @param education 原始学历文本
   * @returns 标准化后的学历
   */
  normalizeEducation(education: string): string {
    if (!education) {
      return '';
    }
    
    const text = education.toLowerCase();
    
    // 本科
    if (text.includes('本科') || text.includes('学士') || text.includes('bachelor')) {
      return '本科';
    }
    
    // 硕士
    if (text.includes('硕士') || text.includes('研究生') || text.includes('master')) {
      return '硕士';
    }
    
    // 博士
    if (text.includes('博士') || text.includes('phd') || text.includes('doctor')) {
      return '博士';
    }
    
    // 大专
    if (text.includes('大专') || text.includes('专科') || text.includes('college')) {
      return '大专';
    }
    
    // 高中
    if (text.includes('高中') || text.includes('中专') || text.includes('high school')) {
      return '高中';
    }
    
    // 其他情况保持原样
    return education;
  }
  
  /**
   * 提取工作年限
   * @param text 包含工作年限的文本
   * @returns 工作年限数字
   */
  extractYearsOfExperience(text: string): number {
    if (!text) {
      return 0;
    }
    
    // 尝试匹配年限数字
    const yearMatch = text.match(/(\d+)[\s]*年/);
    if (yearMatch) {
      return parseInt(yearMatch[1], 10);
    }
    
    // 英文格式，如"5 years"
    const englishYearMatch = text.match(/(\d+)[\s]*years?/i);
    if (englishYearMatch) {
      return parseInt(englishYearMatch[1], 10);
    }
    
    // 简单提取第一个数字
    const numberMatch = text.match(/(\d+)/);
    if (numberMatch) {
      return parseInt(numberMatch[1], 10);
    }
    
    // 应对特殊表达方式
    if (text.includes('应届') || text.includes('毕业生') || text.includes('fresh')) {
      return 0;
    }
    
    if (text.includes('一年') || text.includes('1年') || text.includes('一年以下')) {
      return 1;
    }
    
    // 没有找到明确的工作年限
    return 0;
  }
  
  /**
   * 标准化公司名称
   * @param company 原始公司名称
   * @returns 标准化后的公司名称
   */
  normalizeCompanyName(company: string): string {
    if (!company) {
      return '';
    }
    
    // 移除常见的公司后缀
    return company
      .replace(/(\(.*?\))/g, '') // 移除括号内容
      .replace(/(（.*?）)/g, '') // 移除中文括号内容
      .replace(/有限公司$/g, '')
      .replace(/有限责任公司$/g, '')
      .replace(/股份有限公司$/g, '')
      .replace(/集团$/g, '')
      .replace(/公司$/g, '')
      .replace(/技术$/g, '')
      .replace(/科技$/g, '')
      .trim();
  }
  
  /**
   * 提取技能关键词
   * @param text 技能描述文本
   * @returns 技能关键词数组
   */
  extractSkillKeywords(text: string): string[] {
    if (!text) {
      return [];
    }
    
    // 常见技术关键词列表
    const commonTechKeywords = [
      // 编程语言
      'Java', 'Python', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP',
      // 前端技术
      'React', 'Vue', 'Angular', 'Redux', 'HTML', 'CSS', 'Sass', 'Less', 'Webpack', 'Rollup', 'Tailwind',
      // 后端技术
      'Spring', 'Spring Boot', 'Django', 'Flask', 'Express', 'Node.js', 'Nest.js', 'Laravel',
      // 数据库
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle', 'SQL Server',
      // 云服务和DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git',
      // 大数据和AI
      'Hadoop', 'Spark', 'TensorFlow', 'PyTorch', 'Keras', 'NumPy', 'Pandas',
      // 移动开发
      'Android', 'iOS', 'Swift', 'Kotlin', 'React Native', 'Flutter'
    ];
    
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of commonTechKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerText.includes(lowerKeyword)) {
        keywords.push(keyword);
      }
    }
    
    // 添加额外的分割提取
    const additionalKeywords = text
      .split(/[,，;；、\n]/)
      .map(k => k.trim())
      .filter(k => k.length > 1 && k.length < 20); // 过滤太短或太长的关键词
    
    keywords.push(...additionalKeywords);
    
    // 去重
    return Array.from(new Set(keywords));
  }
  
  /**
   * 清理HTML文本
   * @param html HTML文本
   * @returns 清理后的纯文本
   */
  cleanHtmlText(html: string): string {
    if (!html) {
      return '';
    }
    
    return html
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&nbsp;/g, ' ') // 替换HTML空格
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
  }
} 