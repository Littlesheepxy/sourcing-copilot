"""
候选人仓库
提供候选人数据的CRUD操作
"""

import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_, and_

from automation.database.models import (
    Candidate, CandidateStatus, CandidateSkill, 
    WorkExperience, Education, Project, Skill, Tag
)
from automation.database.db import get_db_session, init_db

class CandidateRepository:
    """候选人仓库类，提供候选人相关操作方法"""
    
    @staticmethod
    def create_candidate(
        name: str,
        education: Optional[str] = None,
        experience: Optional[str] = None,
        skills: Optional[List[str]] = None,
        company: Optional[str] = None,
        school: Optional[str] = None,
        position: Optional[str] = None,
        status: CandidateStatus = CandidateStatus.NEW,
        source: Optional[str] = None,
        source_id: Optional[str] = None,
        raw_data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> str:
        """创建新的候选人
        
        Args:
            name: 姓名
            education: 学历
            experience: 经验
            skills: 技能列表
            company: 公司
            school: 学校
            position: 职位
            status: 状态
            source: 来源
            source_id: 来源ID
            raw_data: 原始数据
            **kwargs: 其他候选人属性
            
        Returns:
            str: 创建的候选人ID
        """
        with get_db_session() as session:
            # 生成候选人ID
            candidate_id = f"c{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
            
            # 创建候选人对象
            candidate = Candidate(
                id=candidate_id,
                name=name,
                education=education,
                experience=experience,
                company=company,
                school=school,
                position=position,
                status=status,
                source=source,
                source_id=source_id,
                raw_data=raw_data,
                **kwargs
            )
            
            session.add(candidate)
            session.flush()
            
            # 如果提供了技能列表，添加技能
            if skills:
                for skill_name in skills:
                    # 获取或创建技能
                    skill = session.query(Skill).filter(Skill.name == skill_name).first()
                    if not skill:
                        skill = Skill(name=skill_name)
                        session.add(skill)
                        session.flush()
                    
                    # 添加候选人技能关联
                    candidate_skill = CandidateSkill(
                        candidate_id=candidate.id,
                        skill_id=skill.id
                    )
                    session.add(candidate_skill)
            
            # 提交事务并返回ID
            session.commit()
            return candidate_id
    
    @staticmethod
    def get_candidate_by_id(candidate_id: str) -> Optional[Candidate]:
        """根据ID获取候选人
        
        Args:
            candidate_id: 候选人ID
            
        Returns:
            Optional[Candidate]: 候选人对象或None
        """
        with get_db_session() as session:
            return session.query(Candidate)\
                .options(
                    joinedload(Candidate.skills).joinedload(CandidateSkill.skill),
                    joinedload(Candidate.work_experiences),
                    joinedload(Candidate.educations),
                    joinedload(Candidate.projects),
                    joinedload(Candidate.tags)
                )\
                .filter(Candidate.id == candidate_id)\
                .first()
    
    @staticmethod
    def get_candidates(
        limit: int = 100, 
        offset: int = 0, 
        status: Optional[CandidateStatus] = None,
        search_term: Optional[str] = None,
        tags: Optional[List[str]] = None,
        skills: Optional[List[str]] = None,
        min_match_score: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取候选人列表，返回字典格式避免Session问题
        
        Args:
            limit: 限制条数
            offset: 偏移量
            status: 按状态过滤
            search_term: 搜索词
            tags: 按标签过滤
            skills: 按技能过滤
            min_match_score: 最低匹配分数
            
        Returns:
            List[Dict[str, Any]]: 候选人字典列表
        """
        with get_db_session() as session:
            query = session.query(Candidate)\
                .options(
                    joinedload(Candidate.skills).joinedload(CandidateSkill.skill),
                    joinedload(Candidate.tags),
                    joinedload(Candidate.work_experiences),
                    joinedload(Candidate.educations),
                    joinedload(Candidate.projects)
                )
            
            # 应用过滤条件
            if status:
                query = query.filter(Candidate.status == status)
            
            if search_term:
                query = query.filter(or_(
                    Candidate.name.ilike(f"%{search_term}%"),
                    Candidate.company.ilike(f"%{search_term}%"),
                    Candidate.school.ilike(f"%{search_term}%"),
                    Candidate.position.ilike(f"%{search_term}%")
                ))
            
            if tags:
                for tag_name in tags:
                    tag_subquery = session.query(Tag.id).filter(Tag.name == tag_name).scalar_subquery()
                    query = query.join(Candidate.tags).filter(Tag.id == tag_subquery)
            
            if skills:
                for skill_name in skills:
                    skill_subquery = session.query(Skill.id).filter(Skill.name == skill_name).scalar_subquery()
                    query = query.join(Candidate.skills).filter(CandidateSkill.skill_id == skill_subquery)
            
            if min_match_score is not None:
                query = query.filter(Candidate.match_score >= min_match_score)
            
            # 执行查询并在Session内转换为字典
            candidates = query.order_by(desc(Candidate.created_at)).offset(offset).limit(limit).all()
            
            # 在Session内转换为字典格式
            candidates_data = []
            for candidate in candidates:
                # 处理技能数据
                skills_list = []
                if candidate.skills:
                    for candidate_skill in candidate.skills:
                        if candidate_skill.skill:
                            skills_list.append(candidate_skill.skill.name)
                
                # 处理标签数据
                tags_list = []
                if candidate.tags:
                    for tag in candidate.tags:
                        tags_list.append(tag.name)
                
                candidate_dict = {
                    "id": candidate.id,
                    "name": candidate.name or "",
                    "education": candidate.education or "",
                    "experience": candidate.experience or "",
                    "skills": skills_list,
                    "company": candidate.company or "",
                    "school": candidate.school or "",
                    "position": candidate.position or "",
                    "status": candidate.status.value if candidate.status else "new",
                    "createdAt": candidate.created_at.isoformat() if candidate.created_at else "",
                    "updatedAt": candidate.updated_at.isoformat() if candidate.updated_at else "",
                    "matchScore": candidate.match_score,
                    "greeting": candidate.greeting or "",
                    "tags": tags_list,
                    "source": candidate.source or "",
                    "sourceId": candidate.source_id or "",
                    "raw_data": candidate.raw_data or {}
                }
                candidates_data.append(candidate_dict)
            
            return candidates_data
    
    @staticmethod
    def count_candidates(
        status: Optional[CandidateStatus] = None,
        search_term: Optional[str] = None,
        tags: Optional[List[str]] = None,
        skills: Optional[List[str]] = None,
        min_match_score: Optional[int] = None
    ) -> int:
        """计算候选人数量
        
        Args:
            status: 按状态过滤
            search_term: 搜索词
            tags: 按标签过滤
            skills: 按技能过滤
            min_match_score: 最低匹配分数
            
        Returns:
            int: 候选人总数
        """
        with get_db_session() as session:
            query = session.query(func.count(Candidate.id))
            
            # 应用过滤条件
            if status:
                query = query.filter(Candidate.status == status)
            
            if search_term:
                query = query.filter(or_(
                    Candidate.name.ilike(f"%{search_term}%"),
                    Candidate.company.ilike(f"%{search_term}%"),
                    Candidate.school.ilike(f"%{search_term}%"),
                    Candidate.position.ilike(f"%{search_term}%")
                ))
            
            if tags:
                for tag_name in tags:
                    tag_subquery = session.query(Tag.id).filter(Tag.name == tag_name).scalar_subquery()
                    query = query.join(Candidate.tags).filter(Tag.id == tag_subquery)
            
            if skills:
                for skill_name in skills:
                    skill_subquery = session.query(Skill.id).filter(Skill.name == skill_name).scalar_subquery()
                    query = query.join(Candidate.skills).filter(CandidateSkill.skill_id == skill_subquery)
            
            if min_match_score is not None:
                query = query.filter(Candidate.match_score >= min_match_score)
                
            return query.scalar()
    
    @staticmethod
    def update_candidate(candidate_id: str, **kwargs) -> Optional[Candidate]:
        """更新候选人信息
        
        Args:
            candidate_id: 候选人ID
            **kwargs: 要更新的属性
            
        Returns:
            Optional[Candidate]: 更新后的候选人对象或None
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return None
            
            # 更新属性
            for key, value in kwargs.items():
                if hasattr(candidate, key):
                    setattr(candidate, key, value)
            
            # 更新时间
            candidate.updated_at = datetime.now()
            
            return candidate
    
    @staticmethod
    def update_candidate_status(candidate_id: str, status: CandidateStatus) -> Optional[Candidate]:
        """更新候选人状态
        
        Args:
            candidate_id: 候选人ID
            status: 新状态
            
        Returns:
            Optional[Candidate]: 更新后的候选人对象或None
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return None
            
            # 更新状态和时间
            candidate.status = status
            candidate.updated_at = datetime.now()
            
            return candidate
    
    @staticmethod
    def delete_candidate(candidate_id: str) -> bool:
        """删除候选人
        
        Args:
            candidate_id: 候选人ID
            
        Returns:
            bool: 是否成功删除
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return False
            
            session.delete(candidate)
            return True
    
    @staticmethod
    def add_work_experience(
        candidate_id: str,
        company: str,
        position: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        is_current: bool = False,
        description: Optional[str] = None,
        achievements: Optional[str] = None
    ) -> Optional[WorkExperience]:
        """添加工作经历
        
        Args:
            candidate_id: 候选人ID
            company: 公司
            position: 职位
            start_date: 开始日期
            end_date: 结束日期
            is_current: 是否当前工作
            description: 描述
            achievements: 成就
            
        Returns:
            Optional[WorkExperience]: 添加的工作经历或None
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return None
            
            work_exp = WorkExperience(
                candidate_id=candidate_id,
                company=company,
                position=position,
                start_date=start_date,
                end_date=end_date,
                is_current=is_current,
                description=description,
                achievements=achievements
            )
            
            session.add(work_exp)
            session.flush()
            
            # 更新候选人
            candidate.updated_at = datetime.now()
            
            return work_exp
    
    @staticmethod
    def add_education(
        candidate_id: str,
        school: str,
        degree: Optional[str] = None,
        major: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        is_current: bool = False,
        description: Optional[str] = None
    ) -> Optional[Education]:
        """添加教育经历
        
        Args:
            candidate_id: 候选人ID
            school: 学校
            degree: 学位
            major: 专业
            start_date: 开始日期
            end_date: 结束日期
            is_current: 是否当前就读
            description: 描述
            
        Returns:
            Optional[Education]: 添加的教育经历或None
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return None
            
            education = Education(
                candidate_id=candidate_id,
                school=school,
                degree=degree,
                major=major,
                start_date=start_date,
                end_date=end_date,
                is_current=is_current,
                description=description
            )
            
            session.add(education)
            session.flush()
            
            # 更新候选人
            candidate.updated_at = datetime.now()
            
            return education
    
    @staticmethod
    def add_project(
        candidate_id: str,
        name: str,
        role: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        description: Optional[str] = None,
        technologies: Optional[str] = None
    ) -> Optional[Project]:
        """添加项目经历
        
        Args:
            candidate_id: 候选人ID
            name: 项目名称
            role: 角色
            start_date: 开始日期
            end_date: 结束日期
            description: 描述
            technologies: 技术栈
            
        Returns:
            Optional[Project]: 添加的项目经历或None
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return None
            
            project = Project(
                candidate_id=candidate_id,
                name=name,
                role=role,
                start_date=start_date,
                end_date=end_date,
                description=description,
                technologies=technologies
            )
            
            session.add(project)
            session.flush()
            
            # 更新候选人
            candidate.updated_at = datetime.now()
            
            return project
    
    @staticmethod
    def add_skill(
        candidate_id: str,
        skill_name: str,
        proficiency: Optional[int] = None,
        years: Optional[float] = None
    ) -> Optional[CandidateSkill]:
        """添加技能
        
        Args:
            candidate_id: 候选人ID
            skill_name: 技能名称
            proficiency: 熟练度(1-5)
            years: 使用年限
            
        Returns:
            Optional[CandidateSkill]: 添加的技能关联或None
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return None
            
            # 获取或创建技能
            skill = session.query(Skill).filter(Skill.name == skill_name).first()
            if not skill:
                skill = Skill(name=skill_name)
                session.add(skill)
                session.flush()
            
            # 检查是否已存在该技能关联
            candidate_skill = session.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate_id,
                CandidateSkill.skill_id == skill.id
            ).first()
            
            if candidate_skill:
                # 更新已有关联
                if proficiency is not None:
                    candidate_skill.proficiency = proficiency
                if years is not None:
                    candidate_skill.years = years
            else:
                # 创建新关联
                candidate_skill = CandidateSkill(
                    candidate_id=candidate_id,
                    skill_id=skill.id,
                    proficiency=proficiency,
                    years=years
                )
                session.add(candidate_skill)
            
            session.flush()
            
            # 更新候选人
            candidate.updated_at = datetime.now()
            
            return candidate_skill
    
    @staticmethod
    def add_tag(candidate_id: str, tag_name: str) -> Optional[Tag]:
        """添加标签
        
        Args:
            candidate_id: 候选人ID
            tag_name: 标签名称
            
        Returns:
            Optional[Tag]: 添加的标签或None
        """
        with get_db_session() as session:
            candidate = session.query(Candidate).filter(Candidate.id == candidate_id).first()
            if not candidate:
                return None
            
            # 获取或创建标签
            tag = session.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                session.add(tag)
                session.flush()
            
            # 检查是否已存在关联
            if tag not in candidate.tags:
                candidate.tags.append(tag)
                session.flush()
            
            # 更新候选人
            candidate.updated_at = datetime.now()
            
            return tag
    
    @staticmethod
    def get_status_counts() -> Dict[CandidateStatus, int]:
        """获取各状态的候选人数量
        
        Returns:
            Dict[CandidateStatus, int]: 状态及其数量
        """
        with get_db_session() as session:
            result = session.query(Candidate.status, func.count(Candidate.id))\
                .group_by(Candidate.status)\
                .all()
            
            # 创建所有状态的计数字典
            counts = {status: 0 for status in CandidateStatus}
            
            # 填充实际数据
            for status, count in result:
                counts[status] = count
                
            return counts 