"""
用户设置数据模型
"""


class Settings:
    """
    用户设置类
    管理用户的各项配置
    """
    
    def __init__(self, visibleProductLines=None):
        """
        初始化设置对象
        
        Args:
            visibleProductLines: 可见产品线ID列表，默认为空列表
        """
        self.visibleProductLines = visibleProductLines or []
    
    def to_dict(self):
        """
        转换为字典格式
        
        Returns:
            dict: 设置数据字典
        """
        return {
            'visibleProductLines': self.visibleProductLines
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        从字典创建设置对象
        
        Args:
            data: 设置数据字典
            
        Returns:
            Settings: 设置对象实例
        """
        return cls(
            visibleProductLines=data.get('visibleProductLines', [])
        )
    
    def validate(self):
        """
        验证设置数据的有效性
        
        Raises:
            ValueError: 数据验证失败时抛出异常
        """
        if not isinstance(self.visibleProductLines, list):
            raise ValueError('visibleProductLines必须是列表类型')
        
        for pl_id in self.visibleProductLines:
            if not isinstance(pl_id, str):
                raise ValueError('产品线ID必须是字符串类型')
