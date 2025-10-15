"""
设置服务层
处理用户设置相关的业务逻辑
"""
from models.settings import Settings
from utils.file_handler import read_json_file, write_json_file, get_data_file_path
import os


class SettingsService:
    """
    设置服务类
    提供设置的读取和更新操作
    """
    
    def __init__(self):
        """初始化服务，设置数据文件路径"""
        self.data_file = get_data_file_path('settings.json')
    
    def get_settings(self):
        """
        获取用户设置
        如果文件不存在，返回默认设置
        
        Returns:
            dict: 设置数据字典
        """
        # 如果文件不存在，返回默认设置
        if not os.path.exists(self.data_file):
            return Settings().to_dict()
        
        try:
            data = read_json_file(self.data_file)
            settings = Settings.from_dict(data)
            return settings.to_dict()
        except Exception as e:
            # 文件损坏时返回默认设置
            print(f"读取设置文件失败: {e}")
            return Settings().to_dict()
    
    def update_visible_productlines(self, productline_ids):
        """
        更新可见产品线配置
        
        Args:
            productline_ids: 产品线ID列表
            
        Returns:
            dict: 更新后的设置数据字典
            
        Raises:
            ValueError: 数据验证失败时抛出异常
        """
        # 创建设置对象并验证
        settings = Settings(visibleProductLines=productline_ids)
        settings.validate()
        
        # 保存到文件
        write_json_file(self.data_file, settings.to_dict())
        
        return settings.to_dict()
    
    def reset_settings(self):
        """
        重置设置为默认值
        
        Returns:
            dict: 默认设置数据字典
        """
        settings = Settings()
        write_json_file(self.data_file, settings.to_dict())
        return settings.to_dict()
