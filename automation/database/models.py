"""
数据库模型定义
使用SQLAlchemy定义数据表结构
"""

import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Table, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class CandidateStatus(enum.Enum):
    """候选人状态枚举"""
    NEW = "new"
    PROCESSING = "processing"
    CONTACTED = "contacted"
    REJECTED = "rejected"
    HIRED = "hired"

# 候选人标签关联表
candidate_tags = Table(
    'candidate_tags',
    Base.metadata,
    Column('candidate_id', String(50), ForeignKey('candidates.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class Candidate(Base):
    """候选人模型"""
    __tablename__ = 'candidates'
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    education = Column(String(50))
    experience = Column(String(50))
    company = Column(String(200))
    school = Column(String(200))
    position = Column(String(100))
    status = Column(Enum(CandidateStatus), default=CandidateStatus.NEW)
    source = Column(String(50))  # 来源：boss、linkedin等
    source_id = Column(String(100))  # 来源平台的ID
    match_score = Column(Integer)  # 匹配分数
    greeting = Column(Text)  # 打招呼语
    raw_data = Column(JSON)  # 原始数据
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # 关联关系
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    work_experiences = relationship("WorkExperience", back_populates="candidate", cascade="all, delete-orphan")
    educations = relationship("Education", back_populates="candidate", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="candidate", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=candidate_tags, back_populates="candidates")

class Skill(Base):
    """技能模型"""
    __tablename__ = 'skills'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50))  # 技能分类
    created_at = Column(DateTime, default=datetime.now)
    
    # 关联关系
    candidate_skills = relationship("CandidateSkill", back_populates="skill")

class CandidateSkill(Base):
    """候选人技能关联模型"""
    __tablename__ = 'candidate_skills'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(String(50), ForeignKey('candidates.id'), nullable=False)
    skill_id = Column(Integer, ForeignKey('skills.id'), nullable=False)
    proficiency = Column(Integer)  # 熟练度 1-5
    years = Column(Float)  # 使用年限
    created_at = Column(DateTime, default=datetime.now)
    
    # 关联关系
    candidate = relationship("Candidate", back_populates="skills")
    skill = relationship("Skill", back_populates="candidate_skills")

class WorkExperience(Base):
    """工作经历模型"""
    __tablename__ = 'work_experiences'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(String(50), ForeignKey('candidates.id'), nullable=False)
    company = Column(String(200), nullable=False)
    position = Column(String(100), nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_current = Column(Integer, default=0)  # 是否当前工作
    description = Column(Text)
    achievements = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # 关联关系
    candidate = relationship("Candidate", back_populates="work_experiences")

class Education(Base):
    """教育经历模型"""
    __tablename__ = 'educations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(String(50), ForeignKey('candidates.id'), nullable=False)
    school = Column(String(200), nullable=False)
    degree = Column(String(50))
    major = Column(String(100))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_current = Column(Integer, default=0)  # 是否当前就读
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # 关联关系
    candidate = relationship("Candidate", back_populates="educations")

class Project(Base):
    """项目经历模型"""
    __tablename__ = 'projects'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(String(50), ForeignKey('candidates.id'), nullable=False)
    name = Column(String(200), nullable=False)
    role = Column(String(100))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    description = Column(Text)
    technologies = Column(Text)  # 使用的技术栈
    created_at = Column(DateTime, default=datetime.now)
    
    # 关联关系
    candidate = relationship("Candidate", back_populates="projects")

class Tag(Base):
    """标签模型"""
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(20))  # 标签颜色
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    
    # 关联关系
    candidates = relationship("Candidate", secondary=candidate_tags, back_populates="tags")

class OperationLog(Base):
    """操作日志模型"""
    __tablename__ = 'operation_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.now)
    action = Column(String(100), nullable=False)
    details = Column(Text)
    data_type = Column(String(50))
    data_id = Column(String(100))
    log_metadata = Column(JSON)  # 改名为log_metadata避免与SQLAlchemy的metadata冲突
    created_at = Column(DateTime, default=datetime.now) 