/**
 * 简历提取器实现
 */
import {
  BasicInfo,
  EducationExperience,
  ProjectExperience,
  ResumeExtractor,
  SelectorsMap,
  WorkExperience
} from './types';
import { DataTransformer } from './data-transformer';

/**
 * 简历提取器
 * 负责从页面元素中提取结构化简历数据
 */
export class ResumeExtractorImpl implements ResumeExtractor {
  private transformer: DataTransformer;
  
  constructor() {
    this.transformer = new DataTransformer();
  }
  
  /**
   * 提取基本信息
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 基本信息
   */
  extractBasicInfo(element: Element, selectors: SelectorsMap): BasicInfo {
    const basicInfo: BasicInfo = {};
    
    // 提取名字
    if (selectors.name) {
      const nameEl = element.querySelector(selectors.name);
      if (nameEl) {
        basicInfo.name = nameEl.textContent?.trim();
      }
    }
    
    // 提取年龄
    if (selectors.age) {
      const ageEl = element.querySelector(selectors.age);
      if (ageEl) {
        const ageText = ageEl.textContent?.trim();
        if (ageText) {
          const ageMatch = ageText.match(/(\d+)/);
          if (ageMatch) {
            basicInfo.age = parseInt(ageMatch[1], 10);
          } else {
            basicInfo.age = ageText;
          }
        }
      }
    }
    
    // 提取性别
    if (selectors.gender) {
      const genderEl = element.querySelector(selectors.gender);
      if (genderEl) {
        basicInfo.gender = genderEl.textContent?.trim();
      }
    }
    
    // 提取学历
    if (selectors.education) {
      const educationEl = element.querySelector(selectors.education);
      if (educationEl) {
        const educationText = educationEl.textContent?.trim();
        if (educationText) {
          basicInfo.education = this.transformer.normalizeEducation(educationText);
        }
      }
    }
    
    // 提取工作年限
    if (selectors.workYears) {
      const workYearsEl = element.querySelector(selectors.workYears);
      if (workYearsEl) {
        const workYearsText = workYearsEl.textContent?.trim();
        if (workYearsText) {
          basicInfo.workYears = this.transformer.extractYearsOfExperience(workYearsText);
        }
      }
    }
    
    // 提取当前职位
    if (selectors.title) {
      const titleEl = element.querySelector(selectors.title);
      if (titleEl) {
        basicInfo.title = titleEl.textContent?.trim();
      }
    }
    
    // 提取电话
    if (selectors.phone) {
      const phoneEl = element.querySelector(selectors.phone);
      if (phoneEl) {
        const phoneText = phoneEl.textContent?.trim();
        if (phoneText) {
          const phoneMatch = phoneText.match(/(\d{11})/);
          if (phoneMatch) {
            basicInfo.phone = phoneMatch[1];
          } else {
            basicInfo.phone = phoneText;
          }
        }
      }
    }
    
    // 提取邮箱
    if (selectors.email) {
      const emailEl = element.querySelector(selectors.email);
      if (emailEl) {
        const emailText = emailEl.textContent?.trim();
        if (emailText) {
          const emailMatch = emailText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            basicInfo.email = emailMatch[0];
          } else {
            basicInfo.email = emailText;
          }
        }
      }
    }
    
    return basicInfo;
  }
  
  /**
   * 提取工作经历
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 工作经历列表
   */
  extractWorkExperience(element: Element, selectors: SelectorsMap): WorkExperience[] {
    const experiences: WorkExperience[] = [];
    
    // 获取工作经历容器
    if (!selectors.workExperienceContainer) {
      return experiences;
    }
    
    const containers = element.querySelectorAll(selectors.workExperienceContainer);
    
    // 遍历每个工作经历
    containers.forEach(container => {
      const experience: Partial<WorkExperience> = {};
      
      // 提取公司名称
      if (selectors.company) {
        const companyEl = container.querySelector(selectors.company);
        if (companyEl) {
          experience.company = companyEl.textContent?.trim() || '';
        }
      }
      
      // 提取职位
      if (selectors.jobTitle) {
        const titleEl = container.querySelector(selectors.jobTitle);
        if (titleEl) {
          experience.title = titleEl.textContent?.trim() || '';
        }
      }
      
      // 提取时间范围
      if (selectors.timeRange) {
        const timeRangeEl = container.querySelector(selectors.timeRange);
        if (timeRangeEl) {
          experience.timeRange = timeRangeEl.textContent?.trim() || '';
        }
      }
      
      // 提取描述
      if (selectors.jobDescription) {
        const descriptionEl = container.querySelector(selectors.jobDescription);
        if (descriptionEl) {
          experience.description = descriptionEl.textContent?.trim() || '';
        }
      }
      
      // 只有当至少有公司和职位信息时才添加到列表
      if (experience.company && experience.title) {
        experiences.push({
          company: experience.company,
          title: experience.title,
          timeRange: experience.timeRange || '',
          description: experience.description || ''
        });
      }
    });
    
    return experiences;
  }
  
  /**
   * 提取项目经历
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 项目经历列表
   */
  extractProjectExperience(element: Element, selectors: SelectorsMap): ProjectExperience[] {
    const projects: ProjectExperience[] = [];
    
    // 获取项目经历容器
    if (!selectors.projectContainer) {
      return projects;
    }
    
    const containers = element.querySelectorAll(selectors.projectContainer);
    
    // 遍历每个项目经历
    containers.forEach(container => {
      const project: Partial<ProjectExperience> = {};
      
      // 提取项目名称
      if (selectors.projectName) {
        const nameEl = container.querySelector(selectors.projectName);
        if (nameEl) {
          project.name = nameEl.textContent?.trim() || '';
        }
      }
      
      // 提取角色
      if (selectors.projectRole) {
        const roleEl = container.querySelector(selectors.projectRole);
        if (roleEl) {
          project.role = roleEl.textContent?.trim() || '';
        }
      }
      
      // 提取时间范围
      if (selectors.projectTimeRange) {
        const timeRangeEl = container.querySelector(selectors.projectTimeRange);
        if (timeRangeEl) {
          project.timeRange = timeRangeEl.textContent?.trim() || '';
        }
      }
      
      // 提取描述
      if (selectors.projectDescription) {
        const descriptionEl = container.querySelector(selectors.projectDescription);
        if (descriptionEl) {
          project.description = descriptionEl.textContent?.trim() || '';
        }
      }
      
      // 只有当至少有项目名称时才添加到列表
      if (project.name) {
        projects.push({
          name: project.name,
          role: project.role || '',
          timeRange: project.timeRange || '',
          description: project.description || ''
        });
      }
    });
    
    return projects;
  }
  
  /**
   * 提取教育经历
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 教育经历列表
   */
  extractEducationExperience(element: Element, selectors: SelectorsMap): EducationExperience[] {
    const educations: EducationExperience[] = [];
    
    // 获取教育经历容器
    if (!selectors.educationContainer) {
      return educations;
    }
    
    const containers = element.querySelectorAll(selectors.educationContainer);
    
    // 遍历每个教育经历
    containers.forEach(container => {
      const education: Partial<EducationExperience> = {};
      
      // 提取学校
      if (selectors.school) {
        const schoolEl = container.querySelector(selectors.school);
        if (schoolEl) {
          education.school = schoolEl.textContent?.trim() || '';
        }
      }
      
      // 提取专业
      if (selectors.major) {
        const majorEl = container.querySelector(selectors.major);
        if (majorEl) {
          education.major = majorEl.textContent?.trim() || '';
        }
      }
      
      // 提取学位
      if (selectors.degree) {
        const degreeEl = container.querySelector(selectors.degree);
        if (degreeEl) {
          const degreeText = degreeEl.textContent?.trim();
          if (degreeText) {
            education.degree = this.transformer.normalizeEducation(degreeText);
          }
        }
      }
      
      // 提取时间范围
      if (selectors.educationTimeRange) {
        const timeRangeEl = container.querySelector(selectors.educationTimeRange);
        if (timeRangeEl) {
          education.timeRange = timeRangeEl.textContent?.trim() || '';
        }
      }
      
      // 只有当至少有学校信息时才添加到列表
      if (education.school) {
        educations.push({
          school: education.school,
          major: education.major || '',
          degree: education.degree || '',
          timeRange: education.timeRange || ''
        });
      }
    });
    
    return educations;
  }
  
  /**
   * 提取技能
   * @param element 目标元素
   * @param selectors 选择器映射
   * @returns 技能列表
   */
  extractSkills(element: Element, selectors: SelectorsMap): string[] {
    const skills: string[] = [];
    
    // 获取技能容器
    if (!selectors.skillsContainer) {
      return skills;
    }
    
    const container = element.querySelector(selectors.skillsContainer);
    if (!container) {
      return skills;
    }
    
    // 提取技能项
    if (selectors.skillItem) {
      const skillItems = container.querySelectorAll(selectors.skillItem);
      skillItems.forEach(item => {
        const skill = item.textContent?.trim();
        if (skill) {
          skills.push(skill);
        }
      });
    } else {
      // 如果没有指定技能项选择器，尝试直接从容器中提取文本
      const skillsText = container.textContent?.trim();
      if (skillsText) {
        // 按逗号或分号分割
        const splitSkills = skillsText.split(/[,，;；]/).map(s => s.trim()).filter(Boolean);
        skills.push(...splitSkills);
      }
    }
    
    return skills;
  }
}