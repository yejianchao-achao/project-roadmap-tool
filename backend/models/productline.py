"""
产品线数据模型
定义产品线的数据结构和验证逻辑
"""
import uuid
import time


class ProductLine:
    """
    产品线数据模型类
    
    Attributes:
        id: 产品线唯一标识符（UUID格式）
        name: 产品线名称
        createdAt: 创建时间戳（毫秒）
    """
    
    def __init__(self, name, id=None, createdAt=None):
        """
        初始化产品线对象
        
        Args:
            name: 产品线名称
            id: 产品线ID（可选，不提供则自动生成）
            createdAt: 创建时间戳（可选，不提供则使用当前时间）
        """
        self.id = id or self._generate_id()
        self.name = name
        self.createdAt = createdAt or self._get_current_timestamp()
        
        # 验证数据
        self.validate()
    
    @staticmethod
    def _generate_id():
        """
        生成唯一的产品线ID
        
        Returns:
            str: UUID格式的ID，带'pl-'前缀
        """
        return f"pl-{str(uuid.uuid4())}"
    
    @staticmethod
    def _get_current_timestamp():
        """
        获取当前时间戳（毫秒）
        
        Returns:
            int: 当前时间戳
        """
        return int(time.time() * 1000)
    
    def validate(self):
        """
        验证产品线数据的有效性
        
        Raises:
            ValueError: 数据验证失败
        """
        if not self.name or not isinstance(self.name, str):
            raise ValueError("产品线名称必须是非空字符串")
        
        if not self.name.strip():
            raise ValueError("产品线名称不能为空白字符")
        
        if len(self.name) > 100:
            raise ValueError("产品线名称长度不能超过100个字符")
    
    def to_dict(self):
        """
        将产品线对象转换为字典
        
        Returns:
            dict: 产品线数据字典
        """
        return {
            'id': self.id,
            'name': self.name,
            'createdAt': self.createdAt
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        从字典创建产品线对象
        
        Args:
            data: 包含产品线数据的字典
            
        Returns:
            ProductLine: 产品线对象
        """
        return cls(
            name=data['name'],
            id=data.get('id'),
            createdAt=data.get('createdAt')
        )
