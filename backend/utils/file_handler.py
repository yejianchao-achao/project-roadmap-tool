"""
文件读写工具模块
提供JSON文件的读取和写入功能，包含文件锁机制防止并发问题
"""
import json
import os
from threading import Lock

# 文件锁字典，为每个文件维护一个锁
_file_locks = {}
_locks_lock = Lock()


def _get_file_lock(filepath):
    """
    获取指定文件的锁对象
    
    Args:
        filepath: 文件路径
        
    Returns:
        Lock: 文件锁对象
    """
    with _locks_lock:
        if filepath not in _file_locks:
            _file_locks[filepath] = Lock()
        return _file_locks[filepath]


def read_json_file(filepath):
    """
    读取JSON文件内容
    
    Args:
        filepath: JSON文件路径
        
    Returns:
        dict: 解析后的JSON数据
        
    Raises:
        FileNotFoundError: 文件不存在
        json.JSONDecodeError: JSON格式错误
    """
    lock = _get_file_lock(filepath)
    
    with lock:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"文件不存在: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)


def write_json_file(filepath, data):
    """
    写入数据到JSON文件
    
    Args:
        filepath: JSON文件路径
        data: 要写入的数据（字典或列表）
        
    Raises:
        IOError: 文件写入失败
    """
    lock = _get_file_lock(filepath)
    
    with lock:
        # 确保目录存在
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 写入文件，使用缩进格式化
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


def get_data_file_path(filename):
    """
    获取data目录下文件的完整路径
    
    Args:
        filename: 文件名
        
    Returns:
        str: 完整文件路径
    """
    # 获取项目根目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    data_dir = os.path.join(project_root, 'data')
    
    return os.path.join(data_dir, filename)
