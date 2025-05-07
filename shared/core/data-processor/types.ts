/**
 * 数据处理类型定义
 */

/**
 * 选择器映射
 */
export interface SelectorsMap {
  [key: string]: string;
}

/**
 * 基本信息
 */
export interface BasicInfo {
  name?: string;
  age?: string | number;
  gender?: string;
  education?: string;
  workYears?: string | number;
  title?: string;
  phone?: string;
  email?: string;
}

/**
 * 工作经历
 */
export interface WorkExperience {
  company: string;
  title: string;
  timeRange: string;
  description: string;
}

/**
 * 项目经历
 */
export interface ProjectExperience {
  name: string;
  role: string;
  timeRange: string;
  description: string;
}

/**
 * 教育经历
 */
export interface EducationExperience {
  school: string;
  major: string;
  degree: string;
  timeRange: string;
}

/**
 * 简历数据
 */
export interface ResumeData {
  basicInfo: BasicInfo;
  workExperience: WorkExperience[];
  projects?: ProjectExperience[];
  education?: EducationExperience[];
  skills?: string[];
  rawData?: string;
}

/**
 * 简历提取器接口
 */
export interface ResumeExtractor {
  /**
   * 提取基本信息
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 基本信息
   */
  extractBasicInfo(element: Element, selectors: SelectorsMap): BasicInfo;
  
  /**
   * 提取工作经历
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 工作经历列表
   */
  extractWorkExperience(element: Element, selectors: SelectorsMap): WorkExperience[];
  
  /**
   * 提取项目经历
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 项目经历列表
   */
  extractProjectExperience(element: Element, selectors: SelectorsMap): ProjectExperience[];
  
  /**
   * 提取教育经历
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 教育经历列表
   */
  extractEducationExperience(element: Element, selectors: SelectorsMap): EducationExperience[];
  
  /**
   * 提取技能
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 技能列表
   */
  extractSkills(element: Element, selectors: SelectorsMap): string[];
} 