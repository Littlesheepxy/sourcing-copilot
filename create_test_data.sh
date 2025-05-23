#!/bin/bash

# 确保目录存在
mkdir -p ~/Library/Application\ Support/SourcingCopilot/

# 创建测试候选人数据文件
cat > ~/Library/Application\ Support/SourcingCopilot/candidates.json << 'EOF'
[
  {
    "id": "test_1",
    "name": "测试用户1",
    "education": "本科",
    "experience": "3年",
    "skills": ["JavaScript", "React", "TypeScript"],
    "company": "测试科技有限公司",
    "school": "测试大学",
    "position": "前端工程师",
    "status": "new",
    "createdAt": "2023-10-10T10:10:10Z",
    "updatedAt": "2023-10-10T10:10:10Z",
    "matchScore": 85,
    "match": 85,
    "greeting": "您好，我对贵公司的前端工程师职位很感兴趣...",
    "detail": {
      "workExperience": "2020-2023 测试科技有限公司 前端工程师",
      "educationExperience": "2016-2020 测试大学 计算机科学",
      "projectExperience": "负责公司核心产品的前端开发",
      "expectation": "期望薪资20k-30k"
    }
  },
  {
    "id": "test_2",
    "name": "测试用户2",
    "education": "硕士",
    "experience": "5年",
    "skills": ["Java", "Spring Boot", "MySQL"],
    "company": "样例科技公司",
    "school": "示例大学",
    "position": "后端工程师",
    "status": "contacted",
    "createdAt": "2023-10-09T10:10:10Z",
    "updatedAt": "2023-10-09T10:10:10Z",
    "matchScore": 92,
    "match": 92,
    "greeting": "贵公司的后端开发岗位很符合我的职业规划...",
    "detail": {
      "workExperience": "2018-2023 样例科技公司 后端工程师",
      "educationExperience": "2015-2018 示例大学 软件工程",
      "projectExperience": "负责公司支付系统的后端架构设计",
      "expectation": "期望薪资25k-35k"
    }
  },
  {
    "id": "test_3",
    "name": "测试用户3",
    "education": "博士",
    "experience": "7年",
    "skills": ["Python", "机器学习", "TensorFlow"],
    "company": "创新AI科技",
    "school": "人工智能大学",
    "position": "算法工程师",
    "status": "processing",
    "createdAt": "2023-10-08T10:10:10Z",
    "updatedAt": "2023-10-08T10:10:10Z",
    "matchScore": 78,
    "match": 78,
    "greeting": "我在机器学习领域有丰富经验，希望能加入贵公司...",
    "detail": {
      "workExperience": "2016-2023 创新AI科技 算法工程师",
      "educationExperience": "2012-2016 人工智能大学 计算机视觉",
      "projectExperience": "开发了多个商业化的AI算法模型",
      "expectation": "期望薪资40k-50k"
    }
  }
]
EOF

echo "测试数据已生成到 ~/Library/Application Support/SourcingCopilot/candidates.json"

# 创建测试日志数据
cat > ~/Library/Application\ Support/SourcingCopilot/logs.json << 'EOF'
[
  {
    "id": "log_1",
    "type": "候选人分析",
    "timestamp": "2023-10-10T10:10:10Z",
    "message": "分析了测试用户1的简历",
    "details": {
      "candidateId": "test_1",
      "candidateName": "测试用户1"
    }
  },
  {
    "id": "log_2",
    "type": "自动打招呼",
    "timestamp": "2023-10-10T10:15:10Z",
    "message": "向测试用户1发送了打招呼信息",
    "details": {
      "candidateId": "test_1",
      "candidateName": "测试用户1",
      "greeting": "您好，我对贵公司的前端工程师职位很感兴趣..."
    }
  },
  {
    "id": "log_3",
    "type": "更新候选人状态",
    "timestamp": "2023-10-10T10:30:10Z",
    "message": "更新了测试用户2的状态为已联系",
    "details": {
      "candidateId": "test_2",
      "candidateName": "测试用户2",
      "oldStatus": "new",
      "newStatus": "contacted"
    }
  }
]
EOF

echo "测试日志已生成到 ~/Library/Application Support/SourcingCopilot/logs.json"

# 设置权限确保文件可读写
chmod 644 ~/Library/Application\ Support/SourcingCopilot/candidates.json
chmod 644 ~/Library/Application\ Support/SourcingCopilot/logs.json

echo "数据文件权限已设置" 