"""
Sourcing Copilot 自动化模块
"""

import sys
import os
from pathlib import Path

# 确保项目根目录在Python路径中
current_dir = Path(__file__).parent
project_root = current_dir.parent

if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

__version__ = "1.0.0" 