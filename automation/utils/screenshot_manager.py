"""
截图管理器模块
负责管理保存的简历截图
"""

import os
import shutil
import json
import time
from datetime import datetime
from typing import List, Dict, Optional

class ScreenshotManager:
    """
    截图管理器类，提供截图浏览和管理功能
    """
    
    def __init__(self, base_dir=None):
        """
        初始化截图管理器
        
        Args:
            base_dir: 截图保存基础目录，默认为用户库目录下的SourcingCopilot/screenshots
        """
        if base_dir is None:
            self.base_dir = os.path.expanduser("~/Library/Application Support/SourcingCopilot/screenshots")
        else:
            self.base_dir = base_dir
            
        # 确保目录存在
        os.makedirs(self.base_dir, exist_ok=True)
        
        # 索引文件路径
        self.index_path = os.path.join(self.base_dir, "screenshot_index.json")
        
        # 初始化索引
        self.index = self._load_index()
        
    def _load_index(self) -> Dict:
        """加载截图索引"""
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"加载截图索引失败: {e}")
                
        # 默认返回空索引
        return {
            "version": 1,
            "last_updated": datetime.now().isoformat(),
            "screenshots": {}
        }
        
    def _save_index(self):
        """保存截图索引"""
        try:
            self.index["last_updated"] = datetime.now().isoformat()
            with open(self.index_path, 'w', encoding='utf-8') as f:
                json.dump(self.index, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"保存截图索引失败: {e}")
            return False
            
    def register_screenshot(self, path: str, resume_data: Dict = None) -> bool:
        """
        注册一个新截图到索引
        
        Args:
            path: 截图路径
            resume_data: 关联的简历数据
            
        Returns:
            bool: 是否成功注册
        """
        try:
            if not os.path.exists(path):
                print(f"截图文件不存在: {path}")
                return False
                
            # 提取文件名
            filename = os.path.basename(path)
            
            # 创建截图记录
            screenshot_info = {
                "path": path,
                "filename": filename,
                "created": datetime.now().isoformat(),
                "type": self._detect_screenshot_type(filename),
                "resume_data": resume_data or {}
            }
            
            # 将截图添加到索引
            self.index["screenshots"][filename] = screenshot_info
            
            # 保存索引
            return self._save_index()
            
        except Exception as e:
            print(f"注册截图失败: {e}")
            return False
            
    def _detect_screenshot_type(self, filename: str) -> str:
        """根据文件名推断截图类型"""
        filename = filename.lower()
        
        if "canvas" in filename:
            return "canvas"
        elif "iframe" in filename:
            return "iframe"
        elif "page" in filename:
            return "page"
        elif "img" in filename:
            return "resume_image"
        else:
            return "unknown"
            
    def get_all_screenshots(self) -> List[Dict]:
        """
        获取所有注册的截图
        
        Returns:
            List[Dict]: 截图列表
        """
        try:
            screenshots = list(self.index["screenshots"].values())
            
            # 按创建时间倒序排序
            screenshots.sort(key=lambda x: x.get("created", ""), reverse=True)
            
            return screenshots
        except Exception as e:
            print(f"获取截图列表失败: {e}")
            return []
            
    def get_screenshots_by_date(self, date_str: str) -> List[Dict]:
        """
        按日期筛选截图
        
        Args:
            date_str: 日期字符串 (YYYY-MM-DD)
            
        Returns:
            List[Dict]: 符合条件的截图列表
        """
        try:
            all_screenshots = self.get_all_screenshots()
            filtered_screenshots = []
            
            for screenshot in all_screenshots:
                created = screenshot.get("created", "")
                if created.startswith(date_str):
                    filtered_screenshots.append(screenshot)
                    
            return filtered_screenshots
        except Exception as e:
            print(f"按日期筛选截图失败: {e}")
            return []
            
    def get_screenshots_by_type(self, type_name: str) -> List[Dict]:
        """
        按类型筛选截图
        
        Args:
            type_name: 截图类型 (canvas, iframe, page, resume_image)
            
        Returns:
            List[Dict]: 符合条件的截图列表
        """
        try:
            all_screenshots = self.get_all_screenshots()
            return [s for s in all_screenshots if s.get("type") == type_name]
        except Exception as e:
            print(f"按类型筛选截图失败: {e}")
            return []
            
    def search_screenshots(self, query: str) -> List[Dict]:
        """
        搜索截图
        
        Args:
            query: 搜索关键词
            
        Returns:
            List[Dict]: 符合条件的截图列表
        """
        try:
            all_screenshots = self.get_all_screenshots()
            query = query.lower()
            
            results = []
            for screenshot in all_screenshots:
                # 在文件名中搜索
                if query in screenshot.get("filename", "").lower():
                    results.append(screenshot)
                    continue
                    
                # 在简历数据中搜索
                resume_data = screenshot.get("resume_data", {})
                for key, value in resume_data.items():
                    if isinstance(value, str) and query in value.lower():
                        results.append(screenshot)
                        break
                        
            return results
        except Exception as e:
            print(f"搜索截图失败: {e}")
            return []
            
    def get_screenshot_path(self, filename: str) -> Optional[str]:
        """
        获取截图文件路径
        
        Args:
            filename: 文件名
            
        Returns:
            str: 截图文件路径，不存在则返回None
        """
        try:
            screenshot_info = self.index["screenshots"].get(filename)
            if screenshot_info:
                path = screenshot_info.get("path")
                if os.path.exists(path):
                    return path
            return None
        except Exception as e:
            print(f"获取截图路径失败: {e}")
            return None
            
    def delete_screenshot(self, filename: str) -> bool:
        """
        删除截图
        
        Args:
            filename: 文件名
            
        Returns:
            bool: 是否成功删除
        """
        try:
            screenshot_info = self.index["screenshots"].get(filename)
            if not screenshot_info:
                return False
                
            path = screenshot_info.get("path")
            
            # 如果文件存在，删除它
            if os.path.exists(path):
                os.remove(path)
                
            # 从索引中移除
            del self.index["screenshots"][filename]
            
            # 保存索引
            return self._save_index()
        except Exception as e:
            print(f"删除截图失败: {e}")
            return False
            
    def clean_old_screenshots(self, days: int = 30) -> int:
        """
        清理指定天数以前的截图
        
        Args:
            days: 天数，默认30天
            
        Returns:
            int: 清理的截图数量
        """
        try:
            # 计算截止时间戳
            cutoff_time = time.time() - (days * 24 * 60 * 60)
            
            # 要删除的文件列表
            to_delete = []
            
            # 筛选要删除的文件
            for filename, info in self.index["screenshots"].items():
                try:
                    path = info.get("path")
                    if not os.path.exists(path):
                        to_delete.append(filename)
                        continue
                        
                    # 获取文件修改时间
                    mtime = os.path.getmtime(path)
                    if mtime < cutoff_time:
                        to_delete.append(filename)
                except Exception:
                    # 出错的记录也删除
                    to_delete.append(filename)
                    
            # 删除筛选出的文件
            deleted_count = 0
            for filename in to_delete:
                if self.delete_screenshot(filename):
                    deleted_count += 1
                    
            return deleted_count
        except Exception as e:
            print(f"清理旧截图失败: {e}")
            return 0
            
    def scan_directory(self) -> int:
        """
        扫描目录，注册未索引的截图
        
        Returns:
            int: 新注册的截图数量
        """
        try:
            # 已索引的文件路径
            indexed_paths = set(info["path"] for info in self.index["screenshots"].values())
            
            # 扫描目录中的所有图片文件
            new_count = 0
            for root, _, files in os.walk(self.base_dir):
                for file in files:
                    if file.endswith(('.png', '.jpg', '.jpeg')):
                        full_path = os.path.join(root, file)
                        
                        # 如果未索引，则注册
                        if full_path not in indexed_paths:
                            if self.register_screenshot(full_path):
                                new_count += 1
                                
            return new_count
        except Exception as e:
            print(f"扫描目录失败: {e}")
            return 0
            
    def generate_html_report(self, output_path: Optional[str] = None) -> str:
        """
        生成HTML报告，便于查看所有截图
        
        Args:
            output_path: 输出路径，默认为截图目录下的report.html
            
        Returns:
            str: 生成的HTML报告路径
        """
        try:
            if output_path is None:
                output_path = os.path.join(self.base_dir, "screenshots_report.html")
                
            # 获取所有截图，按日期分组
            all_screenshots = self.get_all_screenshots()
            
            # 按日期分组
            screenshots_by_date = {}
            for screenshot in all_screenshots:
                created = screenshot.get("created", "")
                date = created.split("T")[0] if "T" in created else created.split(" ")[0]
                
                if date not in screenshots_by_date:
                    screenshots_by_date[date] = []
                    
                screenshots_by_date[date].append(screenshot)
                
            # 生成HTML
            html = """
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>简历截图报告</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                    h1, h2 { color: #333; }
                    .date-group { margin-bottom: 30px; background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
                    .screenshot { border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #fff; }
                    .screenshot img { max-width: 100%; height: auto; cursor: pointer; }
                    .screenshot-info { margin-top: 10px; font-size: 14px; }
                    .filter-bar { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
                    button { padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    button:hover { background: #0069d9; }
                    .modal { display: none; position: fixed; z-index: 100; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); }
                    .modal-content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 90%; max-height: 90%; }
                    .modal-content img { max-width: 100%; max-height: 90vh; }
                    .close-modal { position: absolute; top: 15px; right: 15px; color: white; font-size: 30px; cursor: pointer; }
                    .resume-data { font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; background: #f8f8f8; padding: 10px; border-radius: 4px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <h1>简历截图报告</h1>
                <div class="filter-bar">
                    <button onclick="filterByType('all')">全部</button>
                    <button onclick="filterByType('canvas')">Canvas</button>
                    <button onclick="filterByType('iframe')">iframe</button>
                    <button onclick="filterByType('page')">整页</button>
                    <button onclick="filterByType('resume_image')">图片简历</button>
                </div>
                
                <div id="modal" class="modal">
                    <span class="close-modal" onclick="closeModal()">&times;</span>
                    <div class="modal-content">
                        <img id="modal-img" src="">
                    </div>
                </div>
            """
            
            # 按日期添加截图
            for date in sorted(screenshots_by_date.keys(), reverse=True):
                html += f"""
                <div class="date-group">
                    <h2>{date}</h2>
                    <div class="screenshots">
                """
                
                for screenshot in screenshots_by_date[date]:
                    filename = screenshot.get("filename", "")
                    path = screenshot.get("path", "")
                    type_name = screenshot.get("type", "unknown")
                    
                    # 提取简历数据
                    resume_data = screenshot.get("resume_data", {})
                    name = resume_data.get("name", "未知")
                    position = resume_data.get("position", "未知")
                    
                    # 相对路径
                    rel_path = os.path.relpath(path, os.path.dirname(output_path))
                    
                    html += f"""
                    <div class="screenshot" data-type="{type_name}">
                        <img src="{rel_path}" onclick="openModal(this.src)" alt="{filename}">
                        <div class="screenshot-info">
                            <strong>类型:</strong> {type_name}<br>
                            <strong>姓名:</strong> {name}<br>
                            <strong>职位:</strong> {position}<br>
                            <strong>文件:</strong> {filename}
                        </div>
                    """
                    
                    # 如果有简历数据，添加折叠区域
                    if resume_data:
                        html += f"""
                        <details>
                            <summary>简历数据</summary>
                            <div class="resume-data">
                                <pre>{json.dumps(resume_data, ensure_ascii=False, indent=2)}</pre>
                            </div>
                        </details>
                        """
                        
                    html += "</div>"
                
                html += """
                    </div>
                </div>
                """
            
            # 添加JavaScript
            html += """
            <script>
                function openModal(imgSrc) {
                    document.getElementById('modal-img').src = imgSrc;
                    document.getElementById('modal').style.display = 'block';
                }
                
                function closeModal() {
                    document.getElementById('modal').style.display = 'none';
                }
                
                function filterByType(type) {
                    const screenshots = document.querySelectorAll('.screenshot');
                    screenshots.forEach(shot => {
                        if (type === 'all' || shot.dataset.type === type) {
                            shot.style.display = 'block';
                        } else {
                            shot.style.display = 'none';
                        }
                    });
                }
                
                // 点击模态框背景关闭
                window.onclick = function(event) {
                    const modal = document.getElementById('modal');
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                }
            </script>
            </body>
            </html>
            """
            
            # 写入文件
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html)
                
            return output_path
            
        except Exception as e:
            print(f"生成HTML报告失败: {e}")
            return "" 