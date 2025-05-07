/**
 * 用于更新Boss直聘网站选择器的工具脚本
 * 在浏览器控制台中执行此脚本可更新扩展的选择器配置
 */

// 更新的选择器配置
const updatedSelectors = {
  // 推荐列表页
  name: ".name", // 姓名选择器
  education: ".base-info.job-detail", // 学历选择器
  experience: ".base-info.job-detail", // 经验选择器
  school: ".edu-exp-box .text", // 学校选择器
  company: ".work-exp-box .text", // 公司选择器
  position: ".job-header", // 职位选择器
  skills: ".tag-list", // 技能标签选择器
  greetButton: ".btn-greet", // 打招呼按钮选择器
  resumeCard: ".recommend-card-wrap", // 简历卡片选择器
  
  // 详情页
  detailPage: {
    container: ".detail-content",
    workExperience: ".work-exp-box",
    educationExperience: ".edu-exp-box",
    projectExperience: ".project-exp-box",
    expectation: ".expect-box"
  }
};

// 更新存储中的选择器配置
function updateSelectors() {
  chrome.storage.local.set({ selectors: updatedSelectors }, () => {
    console.log('选择器配置已更新:', updatedSelectors);
    alert('选择器配置已更新，请刷新页面以应用新配置');
  });
}

// 立即更新选择器
updateSelectors(); 