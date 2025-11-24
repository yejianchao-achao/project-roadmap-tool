"""
项目数据模型
定义项目的数据结构和验证逻辑
"""
import uuid
import time
from datetime import datetime


class Project:
    """
    项目数据模型类
    
    Attributes:
        id: 项目唯一标识符（UUID格式）
        name: 项目名称
        productLineId: 所属产品线ID
        ownerId: 项目负责人ID
        isPending: 是否暂定
        startDate: 开始日期（YYYY-MM-DD格式）
        endDate: 结束日期（YYYY-MM-DD格式）
        status: 项目状态（规划|方案|设计|开发|测试|已上|暂停）
        remarks: 项目备注（非必填，最大500字符）
        createdAt: 创建时间戳（毫秒）
        updatedAt: 更新时间戳（毫秒）
    """
    
    # 有效的项目状态
    VALID_STATUSES = ['规划', '方案', '设计', '开发', '测试', '已上', '暂停']
    
    def __init__(self, name, productLineId, startDate, endDate, status,
                 ownerId=None, isPending=False, remarks='', id=None, createdAt=None, updatedAt=None):
        """
        初始化项目对象
        
        Args:
            name: 项目名称
            productLineId: 所属产品线ID
            startDate: 开始日期（YYYY-MM-DD格式）
            endDate: 结束日期（YYYY-MM-DD格式）
            status: 项目状态
            ownerId: 项目负责人ID（必填）
            isPending: 是否暂定（可选，默认False）
            remarks: 项目备注（可选，默认''，最大500字符）
            id: 项目ID（可选，不提供则自动生成）
            createdAt: 创建时间戳（可选，不提供则使用当前时间）
            updatedAt: 更新时间戳（可选，不提供则使用当前时间）
        """
        self.id = id or self._generate_id()
        self.name = name
        self.productLineId = productLineId
        self.ownerId = ownerId  # 新增：项目负责人ID
        self.isPending = isPending  # 新增：是否暂定
        self.startDate = startDate
        self.endDate = endDate
        self.status = status
        self.remarks = remarks  # 新增：项目备注
        self.createdAt = createdAt or self._get_current_timestamp()
        self.updatedAt = updatedAt or self._get_current_timestamp()
        
        # 验证数据
        self.validate()
    
    @staticmethod
    def _generate_id():
        """
        生成唯一的项目ID
        
        Returns:
            str: UUID格式的ID，带'proj-'前缀
        """
        return f"proj-{str(uuid.uuid4())}"
    
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
        验证项目数据的有效性
        
        Raises:
            ValueError: 数据验证失败
        """
        # 验证项目名称
        if not self.name or not isinstance(self.name, str):
            raise ValueError("项目名称必须是非空字符串")
        
        if not self.name.strip():
            raise ValueError("项目名称不能为空白字符")
        
        if len(self.name) > 200:
            raise ValueError("项目名称长度不能超过200个字符")
        
        # 验证产品线ID
        if not self.productLineId or not isinstance(self.productLineId, str):
            raise ValueError("产品线ID必须是非空字符串")
        
        # 验证负责人ID
        if not self.ownerId or not isinstance(self.ownerId, str):
            raise ValueError("项目负责人ID必须是非空字符串")
        
        # 验证状态
        if self.status not in self.VALID_STATUSES:
            raise ValueError(f"项目状态必须是以下之一: {', '.join(self.VALID_STATUSES)}")
        
        # 验证日期格式
        try:
            start = datetime.strptime(self.startDate, '%Y-%m-%d')
            end = datetime.strptime(self.endDate, '%Y-%m-%d')
        except ValueError as e:
            raise ValueError(f"日期格式错误，必须是YYYY-MM-DD格式: {str(e)}")
        
        # 验证日期逻辑
        if end < start:
            raise ValueError("结束日期必须大于或等于开始日期")
        
        # 验证备注字段
        if self.remarks is not None:
            if not isinstance(self.remarks, str):
                raise ValueError("项目备注必须是字符串类型")
            
            if len(self.remarks) > 500:
                raise ValueError("项目备注长度不能超过500个字符")
    
    def to_dict(self):
        """
        将项目对象转换为字典
        
        Returns:
            dict: 项目数据字典
        """
        return {
            'id': self.id,
            'name': self.name,
            'productLineId': self.productLineId,
            'ownerId': self.ownerId,  # 新增
            'isPending': self.isPending,  # 新增：是否暂定
            'startDate': self.startDate,
            'endDate': self.endDate,
            'status': self.status,
            'remarks': self.remarks,  # 新增：项目备注
            'createdAt': self.createdAt,
            'updatedAt': self.updatedAt
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        从字典创建项目对象
        
        Args:
            data: 包含项目数据的字典
            
        Returns:
            Project: 项目对象
        """
        return cls(
            name=data['name'],
            productLineId=data['productLineId'],
            startDate=data['startDate'],
            endDate=data['endDate'],
            status=data['status'],
            ownerId=data.get('ownerId'),  # 新增，使用get以兼容旧数据
            isPending=data.get('isPending', False),  # 新增：是否暂定，默认False
            remarks=data.get('remarks', ''),  # 新增：项目备注，默认空字符串以兼容旧数据
            id=data.get('id'),
            createdAt=data.get('createdAt'),
            updatedAt=data.get('updatedAt')
        )
    
    def update(self, **kwargs):
        """
        更新项目属性
        
        Args:
            **kwargs: 要更新的属性键值对
        """
        allowed_fields = ['name', 'productLineId', 'ownerId', 'startDate', 'endDate', 'status', 'isPending', 'remarks']  # 新增remarks
        
        for key, value in kwargs.items():
            if key in allowed_fields:
                setattr(self, key, value)
        
        # 更新时间戳
        self.updatedAt = self._get_current_timestamp()
        
        # 重新验证
        self.validate()
