"""
数据库连接和会话管理
"""

import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from .models import Base

# 数据库配置
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./sourcing_copilot.db')

# 创建数据库引擎
if DATABASE_URL.startswith('sqlite'):
    # SQLite配置
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False  # 设置为True可以看到SQL语句
    )
else:
    # 其他数据库配置
    engine = create_engine(DATABASE_URL, echo=False)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """初始化数据库，创建所有表"""
    try:
        Base.metadata.create_all(bind=engine)
        print("数据库初始化成功")
        return True
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        return False

@contextmanager
def get_db_session() -> Session:
    """获取数据库会话的上下文管理器"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"数据库操作失败: {e}")
        raise
    finally:
        session.close()

def get_db():
    """获取数据库会话（用于依赖注入）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def reset_db():
    """重置数据库（删除所有表并重新创建）"""
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("数据库重置成功")
        return True
    except Exception as e:
        print(f"数据库重置失败: {e}")
        return False

def check_db_connection():
    """检查数据库连接是否正常"""
    try:
        with get_db_session() as session:
            session.execute("SELECT 1")
        print("数据库连接正常")
        return True
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return False 