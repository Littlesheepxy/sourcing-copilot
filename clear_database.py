#!/usr/bin/env python3
"""
清空数据库脚本
删除所有候选人和操作日志数据
"""

import sys
import os
sys.path.append('.')

from automation.database.db import get_db_session, init_db, check_db_connection
from automation.database.models import Candidate, OperationLog, CandidateSkill, WorkExperience, Education, Project, Tag, Skill

def clear_database():
    """清空数据库中的所有数据"""
    print("🗑️  开始清空数据库...")
    
    # 检查数据库连接
    if not check_db_connection():
        print("❌ 数据库连接失败，无法清空数据库")
        return False
    
    try:
        with get_db_session() as session:
            # 删除所有数据（按依赖关系顺序）
            print("删除候选人技能关联...")
            session.query(CandidateSkill).delete()
            
            print("删除工作经历...")
            session.query(WorkExperience).delete()
            
            print("删除教育经历...")
            session.query(Education).delete()
            
            print("删除项目经历...")
            session.query(Project).delete()
            
            print("删除操作日志...")
            deleted_logs = session.query(OperationLog).delete()
            
            print("删除候选人...")
            deleted_candidates = session.query(Candidate).delete()
            
            print("删除技能...")
            session.query(Skill).delete()
            
            print("删除标签...")
            session.query(Tag).delete()
            
            # 提交更改
            session.commit()
            
            print(f"✅ 数据库清空完成！")
            print(f"   - 删除了 {deleted_candidates} 个候选人")
            print(f"   - 删除了 {deleted_logs} 条操作日志")
            
        return True
        
    except Exception as e:
        print(f"❌ 清空数据库失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def clear_json_files():
    """清空相关的JSON文件"""
    print("\n🗑️  清理JSON文件...")
    
    config_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot")
    files_to_clear = [
        "candidates.json",
        "candidates.json.backup", 
        "logs.json"
    ]
    
    for filename in files_to_clear:
        filepath = os.path.join(config_dir, filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                print(f"✅ 删除文件: {filename}")
            except Exception as e:
                print(f"❌ 删除文件失败 {filename}: {e}")
        else:
            print(f"ℹ️  文件不存在: {filename}")

if __name__ == "__main__":
    print("=" * 50)
    print("🧹 Sourcing Copilot 数据库清理工具")
    print("=" * 50)
    
    # 确认操作
    confirm = input("\n⚠️  警告：此操作将删除所有候选人和操作日志数据！\n是否继续？(输入 'yes' 确认): ")
    
    if confirm.lower() != 'yes':
        print("❌ 操作已取消")
        sys.exit(0)
    
    # 清空数据库
    if clear_database():
        # 清理JSON文件
        clear_json_files()
        print("\n🎉 数据库和文件清理完成！")
        print("💡 现在可以重新运行自动化流程来收集新的候选人数据")
    else:
        print("\n❌ 数据库清理失败")
        sys.exit(1) 