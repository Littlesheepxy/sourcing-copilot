"""
数据库连接和会话管理
"""

import os
import sys
from pathlib import Path
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from .models import Base

def get_app_data_dir():
    """获取应用数据目录"""
    if sys.platform == "darwin":  # macOS
        app_data_dir = Path.home() / "Library" / "Application Support" / "SourcingCopilot"
    elif sys.platform == "win32":  # Windows
        app_data_dir = Path(os.environ.get("APPDATA", "")) / "SourcingCopilot"
    else:  # Linux
        app_data_dir = Path.home() / ".local" / "share" / "SourcingCopilot"
    
    # 确保目录存在
    app_data_dir.mkdir(parents=True, exist_ok=True)
    return app_data_dir

def get_database_path():
    """获取数据库文件路径"""
    # 优先使用环境变量
    if os.getenv('DATABASE_URL'):
        return os.getenv('DATABASE_URL')
    
    # 检查是否在开发环境
    if getattr(sys, 'frozen', False):
        # 打包后的环境，使用用户数据目录
        db_path = get_app_data_dir() / "sourcing_copilot.db"
    else:
        # 开发环境，使用项目目录
        db_path = Path(__file__).parent.parent / "sourcing_copilot.db"
    
    return f"sqlite:///{db_path}"

def init_database_from_template():
    """从模板初始化数据库文件（仅在打包环境）"""
    if not getattr(sys, 'frozen', False):
        return  # 开发环境不需要
    
    user_db_path = get_app_data_dir() / "sourcing_copilot.db"
    
    # 如果用户数据库已存在，不覆盖
    if user_db_path.exists():
        return
    
    # 查找模板数据库文件
    template_paths = [
        Path(sys.executable).parent / "server" / "sourcing_copilot_template.db",
        Path(sys.executable).parent.parent / "Resources" / "server" / "sourcing_copilot_template.db",
    ]
    
    template_db_path = None
    for path in template_paths:
        if path.exists():
            template_db_path = path
            break
    
    if template_db_path:
        import shutil
        print(f"从模板复制数据库: {template_db_path} -> {user_db_path}")
        shutil.copy2(template_db_path, user_db_path)
    else:
        print("未找到数据库模板，将创建新数据库")

# 数据库配置
DATABASE_URL = get_database_path()

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
        # 在打包环境中，尝试从模板复制数据库
        init_database_from_template()
        
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
            session.execute(text("SELECT 1"))
        print("数据库连接正常")
        return True
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return False 