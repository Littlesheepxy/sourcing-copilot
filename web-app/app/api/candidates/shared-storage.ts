// 模拟候选人数据存储，仅用于开发环境
// 在实际生产环境中应该使用数据库

export interface Candidate {
  id: string;
  name: string;
  education: string;
  experience: string;
  skills: string[];
  company?: string;
  school?: string;
  position?: string;
  status?: 'new' | 'processing' | 'contacted' | 'rejected' | 'hired';
  createdAt: string;
  updatedAt: string;
  detail?: {
    workExperience?: string;
    educationExperience?: string;
    projectExperience?: string;
    expectation?: string;
  };
}

// 生成一些示例候选人数据
const generateSampleCandidates = (): Candidate[] => {
  return [
    {
      id: 'c001',
      name: '张三',
      education: '本科',
      experience: '3年',
      skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'],
      company: '科技有限公司',
      school: '某大学',
      position: '前端工程师',
      status: 'new',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      detail: {
        workExperience: `
科技有限公司 | 前端工程师 | 2020-2023
负责公司主要产品的前端开发和维护，参与多个项目的架构设计和技术选型。
使用React和TypeScript进行开发，优化了产品性能和用户体验。

互联网公司 | 初级前端工程师 | 2018-2020
参与公司电商平台的开发和维护，负责多个页面组件的开发。
使用Vue.js和Element UI进行开发，实现了多个复杂交互功能。
        `,
        educationExperience: `
某大学 | 计算机科学与技术 | 本科 | 2014-2018
主修课程：数据结构、算法、计算机网络、操作系统、数据库系统等。
        `,
        projectExperience: `
企业管理系统 | 前端负责人 | 2021-2022
使用React和TypeScript开发的企业内部管理系统，包含人事、财务、客户管理等多个模块。
负责前端架构设计、组件开发和性能优化，实现了系统的高效稳定运行。

电商平台改版 | 核心开发 | 2019-2020
参与公司电商平台的全面改版，使用Vue.js重构了整个前端系统。
负责购物车、订单和支付等核心模块的开发，优化了用户购物流程，提升了转化率。
        `,
        expectation: `
期望职位：高级前端工程师
期望薪资：25K-30K
期望城市：上海
        `
      }
    },
    {
      id: 'c002',
      name: '李四',
      education: '硕士',
      experience: '5年',
      skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker'],
      company: '互联网科技公司',
      school: '某理工大学',
      position: '后端工程师',
      status: 'contacted',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      detail: {
        workExperience: `
互联网科技公司 | 后端工程师 | 2018-2023
负责公司核心服务的开发和维护，包括用户服务、订单系统和支付系统。
使用Java和Spring Boot框架进行开发，负责系统架构设计和性能优化。

某科技有限公司 | 初级工程师 | 2015-2018
参与开发公司内部工具和API服务，负责数据库设计和接口开发。
使用Java和MySQL进行开发，实现了多个关键业务功能。
        `,
        educationExperience: `
某理工大学 | 软件工程 | 硕士 | 2013-2015
某大学 | 计算机科学与技术 | 本科 | 2009-2013
        `,
        projectExperience: `
电商平台订单系统 | 技术负责人 | 2020-2022
使用Java和Spring Boot开发的高并发订单处理系统，支持每秒数千订单的处理能力。
负责系统架构设计、核心模块开发和性能优化，确保了系统的高可用性和可扩展性。

支付网关服务 | 核心开发 | 2018-2020
开发了对接多种支付渠道的统一支付网关，支持实时交易和异步通知处理。
使用Java开发，集成了多种安全机制，确保交易的安全和稳定。
        `
      }
    },
    {
      id: 'c003',
      name: '王五',
      education: '本科',
      experience: '2年',
      skills: ['Python', 'Django', 'Flask', 'MongoDB', 'AWS'],
      company: '创业公司',
      school: '某师范大学',
      position: '全栈工程师',
      status: 'processing',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      detail: {
        workExperience: `
创业公司 | 全栈工程师 | 2021-2023
负责公司产品的前后端开发，包括Web应用和移动应用的API服务。
使用Python和Django框架进行后端开发，React进行前端开发。

某科技公司 | 实习工程师 | 2020-2021
参与公司数据分析平台的开发，负责数据处理和可视化功能。
使用Python和各种数据分析库进行开发，实现了实时数据展示功能。
        `,
        educationExperience: `
某师范大学 | 软件工程 | 本科 | 2017-2021
        `,
        projectExperience: `
社交媒体分析平台 | 全栈开发 | 2022-2023
使用Python和Django开发的社交媒体数据分析平台，支持多平台数据采集和分析。
负责前后端开发和AWS云服务部署，实现了实时数据处理和可视化功能。

在线教育系统 | 后端开发 | 2021-2022
基于Flask框架开发的在线教育系统，支持视频课程、在线测试和学习进度跟踪。
负责后端API开发和MongoDB数据库设计，确保了系统的可扩展性和性能。
        `
      }
    }
  ];
};

// 导出候选人数组，便于在不同路由之间共享
export const candidates: Candidate[] = generateSampleCandidates(); 