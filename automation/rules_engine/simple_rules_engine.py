"""
Boss直聘Sourcing智能助手 - 简化规则引擎
基于thefuzz库的模糊搜索能力，实现简单直观的规则筛选
"""

import uuid
from enum import Enum, IntEnum
from thefuzz import fuzz

class SimpleRuleType(str, Enum):
    """简化规则类型枚举"""
    POSITION = "岗位"
    COMPANY = "公司"
    KEYWORD = "岗位核心关键词"
    SCHOOL = "学校"
    EDUCATION = "学历"

class ImportanceLevel(IntEnum):
    """重要性级别枚举"""
    NOT_IMPORTANT = 25  # 不重要
    NORMAL = 50         # 一般
    IMPORTANT = 75      # 重要
    VERY_IMPORTANT = 100  # 非常重要

class SimpleRulesEngine:
    """简化规则引擎"""

    def create_default_config(self):
        """
        创建默认规则配置
        
        Returns:
            dict: 默认规则配置
        """
        return {
            "rules": [
                # 默认岗位规则
                {
                    "id": str(uuid.uuid4()),
                    "type": SimpleRuleType.POSITION,
                    "keywords": ["前端开发", "前端工程师"],
                    "importance": ImportanceLevel.VERY_IMPORTANT,
                    "mustMatch": True,  # 岗位必须匹配
                    "enabled": True,
                    "order": 0
                },
                # 默认公司规则
                {
                    "id": str(uuid.uuid4()),
                    "type": SimpleRuleType.COMPANY,
                    "keywords": ["竞品公司A", "竞品公司B"],
                    "importance": ImportanceLevel.VERY_IMPORTANT,
                    "mustMatch": False,
                    "enabled": True,
                    "order": 1
                },
                # 默认关键词规则
                {
                    "id": str(uuid.uuid4()),
                    "type": SimpleRuleType.KEYWORD,
                    "keywords": ["React", "Vue", "TypeScript"],
                    "importance": ImportanceLevel.IMPORTANT,
                    "mustMatch": False,
                    "enabled": True,
                    "order": 2,
                    "passScore": 60
                }
            ],
            "autoMode": False
        }

    def create_rule(self, type, keywords=None, importance=ImportanceLevel.NORMAL, must_match=False, order=0):
        """
        创建新规则
        
        Args:
            type: 规则类型
            keywords: 关键词列表
            importance: 重要性
            must_match: 是否必须匹配
            order: 顺序
            
        Returns:
            dict: 规则对象
        """
        if keywords is None:
            keywords = []
            
        rule = {
            "id": str(uuid.uuid4()),
            "type": type,
            "keywords": keywords,
            "importance": importance,
            "mustMatch": must_match,
            "enabled": True,
            "order": order
        }
        
        # 如果是关键词规则，添加默认通过分数
        if type == SimpleRuleType.KEYWORD:
            rule["passScore"] = 60
            
        return rule

    def evaluate_candidate(self, candidate, config):
        """
        评估候选人
        
        Args:
            candidate: 候选人数据
            config: 规则配置
            
        Returns:
            dict: 评估结果，包含三个阶段的评估结果
              - 期望职位是否匹配
              - 过往公司是否为竞对
              - 关键词匹配得分与结果
        """
        # 初始化结果
        result = {
            "candidateId": candidate.get("id"),
            "candidateName": candidate.get("name"),
            "score": 0,
            "passed": False,
            "details": [],
            "action": "manual" if not config.get("autoMode") else "manual",
            "stageResult": {
                "positionMatched": False,  # 职位是否匹配
                "competitorCompany": False,  # 是否竞对公司
                "keywordScore": 0,         # 关键词匹配分数
                "keywordPassed": False     # 关键词是否通过
            }
        }

        # 按顺序排序的启用规则
        active_rules = [r for r in config.get("rules", []) if r.get("enabled")]
        active_rules.sort(key=lambda r: r.get("order", 0))

        # 第一阶段：检查期望职位是否匹配
        position_rules = [r for r in active_rules if r.get("type") == SimpleRuleType.POSITION]
        if position_rules:
            position_matched = False
            for rule in position_rules:
                matched = self._match_rule(candidate, rule)
                result["details"].append({
                    "ruleType": rule.get("type"),
                    "matched": matched.get("matched"),
                    "keywords": rule.get("keywords", []),
                    "matchedKeywords": matched.get("matchedKeywords", []),
                    "importance": rule.get("importance"),
                    "order": rule.get("order")
                })
                
                if matched.get("matched"):
                    position_matched = True
                    break
                    
            result["stageResult"]["positionMatched"] = position_matched
            
            # 职位不匹配，直接淘汰
            if not position_matched:
                result["passed"] = False
                result["action"] = "skip"
                result["rejectReason"] = "岗位不匹配"
                print(f"候选人 {candidate.get('name')} 岗位不匹配，直接淘汰")
                return result
        else:
            # 没有职位规则，默认通过第一阶段
            result["stageResult"]["positionMatched"] = True
            
        # 第二阶段：检查是否为竞对公司
        company_rules = [r for r in active_rules if r.get("type") == SimpleRuleType.COMPANY]
        if company_rules:
            for rule in company_rules:
                matched = self._match_rule(candidate, rule)
                result["details"].append({
                    "ruleType": rule.get("type"),
                    "matched": matched.get("matched"),
                    "keywords": rule.get("keywords", []),
                    "matchedKeywords": matched.get("matchedKeywords", []),
                    "importance": rule.get("importance"),
                    "order": rule.get("order")
                })
                
                if matched.get("matched"):
                    result["stageResult"]["competitorCompany"] = True
                    break
                    
            # 如果是竞对公司，直接通过
            if result["stageResult"]["competitorCompany"]:
                result["passed"] = True
                result["action"] = "greet"
                result["rejectReason"] = ""
                print(f"候选人 {candidate.get('name')} 来自竞对公司，直接通过")
                return result
        
        # 第三阶段：评估关键词得分
        keyword_rules = [r for r in active_rules if r.get("type") == SimpleRuleType.KEYWORD]
        if keyword_rules:
            # 计算关键词匹配得分
            result["stageResult"]["keywordScore"] = self._calculate_keyword_score(candidate, keyword_rules)
            
            # 获取通过分数（使用第一个关键词规则的通过分数）
            pass_score = keyword_rules[0].get("passScore", 60)
            result["stageResult"]["keywordPassed"] = result["stageResult"]["keywordScore"] >= pass_score
            
            # 更新总分和通过状态
            result["score"] = result["stageResult"]["keywordScore"]
            result["passed"] = result["stageResult"]["keywordPassed"]
            
            if result["passed"]:
                result["action"] = "greet"
                result["rejectReason"] = ""
                print(f"候选人 {candidate.get('name')} 关键词匹配得分 {result['score']}，高于阈值 {pass_score}，通过")
            else:
                result["action"] = "skip"
                result["rejectReason"] = f"关键词得分不足 (得分:{result['score']}, 阈值:{pass_score})"
                print(f"候选人 {candidate.get('name')} 关键词匹配得分 {result['score']}，低于阈值 {pass_score}，未通过")
        else:
            # 如果没有关键词规则，则第三阶段默认通过
            result["passed"] = True
            result["action"] = "greet"
            result["rejectReason"] = ""
            print(f"候选人 {candidate.get('name')} 无关键词规则，默认通过")
            
        # 收集所有其他规则的评估结果（学校、学历等）
        for rule in [r for r in active_rules if r.get("type") not in [SimpleRuleType.POSITION, SimpleRuleType.COMPANY, SimpleRuleType.KEYWORD]]:
            matched = self._match_rule(candidate, rule)
            result["details"].append({
                "ruleType": rule.get("type"),
                "matched": matched.get("matched"),
                "keywords": rule.get("keywords", []),
                "matchedKeywords": matched.get("matchedKeywords", []),
                "importance": rule.get("importance"),
                "order": rule.get("order")
            })
            
        return result

    def _calculate_keyword_score(self, candidate, keyword_rules):
        """
        计算关键词得分
        
        Args:
            candidate: 候选人数据
            keyword_rules: 关键词规则列表
            
        Returns:
            int: 得分(0-100)
        """
        if not keyword_rules:
            return 0
            
        # 合并所有关键词规则中的关键词
        all_keywords = []
        for rule in keyword_rules:
            all_keywords.extend(rule.get("keywords", []))
            
        if not all_keywords:
            return 0
            
        # 从候选人的各种文本字段中收集文本
        source_texts = []
        
        # 添加职位
        if candidate.get("position"):
            source_texts.append(candidate.get("position"))
            
        # 添加技能标签
        if candidate.get("skills") and isinstance(candidate.get("skills"), list):
            source_texts.extend(candidate.get("skills"))
            
        # 添加工作经历
        if candidate.get("workExperience"):
            source_texts.append(candidate.get("workExperience"))
            
        # 添加项目经历
        if candidate.get("projectExperience"):
            source_texts.append(candidate.get("projectExperience"))
            
        # 添加完整文本
        if candidate.get("fullText"):
            source_texts.append(candidate.get("fullText"))
            
        if not source_texts:
            return 0
            
        # 合并所有文本
        combined_text = " ".join(source_texts).lower()
        
        # 计算匹配关键词数量
        matched_count = 0
        for keyword in all_keywords:
            if not keyword:
                continue
                
            # 进行模糊匹配
            for text in source_texts:
                if not text:
                    continue
                    
                # 直接包含
                if keyword.lower() in text.lower():
                    matched_count += 1
                    break
                    
                # 使用模糊匹配
                ratio = fuzz.partial_ratio(keyword.lower(), text.lower())
                if ratio >= 90:  # 90%以上相似度认为匹配
                    matched_count += 1
                    break
                    
        # 计算得分
        total_keywords = len(all_keywords)
        if total_keywords == 0:
            return 0
            
        score = (matched_count / total_keywords) * 100
        return min(100, int(score))

    def _match_rule(self, candidate, rule):
        """
        规则匹配
        
        Args:
            candidate: 候选人数据
            rule: 规则
            
        Returns:
            dict: 匹配结果
        """
        matched = False
        matched_keywords = []
        
        # 根据规则类型选择不同的匹配源
        rule_type = rule.get("type")
        source = None
        
        if rule_type == SimpleRuleType.POSITION:
            source = candidate.get("position", "")
        elif rule_type == SimpleRuleType.COMPANY:
            source = candidate.get("company", [])
        elif rule_type == SimpleRuleType.SCHOOL:
            source = candidate.get("schools", [])
        elif rule_type == SimpleRuleType.EDUCATION:
            source = candidate.get("education", "")
        elif rule_type == SimpleRuleType.KEYWORD:
            # 关键词匹配多个源
            source = []
            if candidate.get("position"):
                source.append(candidate.get("position"))
            if candidate.get("skills") and isinstance(candidate.get("skills"), list):
                source.extend(candidate.get("skills"))
            if candidate.get("workExperience"):
                source.append(candidate.get("workExperience"))
            if candidate.get("projectExperience"):
                source.append(candidate.get("projectExperience"))
            if candidate.get("fullText"):
                source.append(candidate.get("fullText"))
        
        # 进行匹配
        keywords = rule.get("keywords", [])
        for keyword in keywords:
            if not keyword:
                continue
                
            # 处理不同类型的源
            if isinstance(source, str):
                # 字符串源
                if keyword.lower() in source.lower():
                    matched = True
                    matched_keywords.append(keyword)
                else:
                    # 模糊匹配
                    ratio = fuzz.partial_ratio(keyword.lower(), source.lower())
                    if ratio >= 85:  # 85%以上相似度认为匹配
                        matched = True
                        matched_keywords.append(keyword)
            elif isinstance(source, list):
                # 列表源
                keyword_matched = False
                for item in source:
                    if not item:
                        continue
                        
                    if isinstance(item, str):
                        # 直接包含
                        if keyword.lower() in item.lower():
                            matched = True
                            matched_keywords.append(keyword)
                            keyword_matched = True
                            break
                            
                        # 模糊匹配
                        ratio = fuzz.partial_ratio(keyword.lower(), item.lower())
                        if ratio >= 85:  # 85%以上相似度认为匹配
                            matched = True
                            matched_keywords.append(keyword)
                            keyword_matched = True
                            break
                            
                # 已找到匹配，跳过后续关键词
                if keyword_matched and rule_type != SimpleRuleType.KEYWORD:
                    break
        
        return {
            "matched": matched,
            "matchedKeywords": matched_keywords
        } 