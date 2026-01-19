"""
人员数据模型
定义项目负责人的数据结构和验证逻辑
"""
import uuid
import time
import re


class Owner:
    """
    人员数据模型类
    
    Attributes:
        id: 人员唯一标识符（owner-{UUID}格式）
        name: 人员姓名（必填，1-50字符）
        color: 分配的颜色（HEX格式，如#FF6B6B）
        createdAt: 创建时间戳（毫秒）
    """
    
    # 预定义颜色池（20种高对比度颜色）
    COLOR_POOL = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
        '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
        '#E67E22', '#95A5A6', '#34495E', '#16A085', '#27AE60'
    ]
    
    def __init__(self, name, id=None, color=None, createdAt=None, visible=True):
        """
        初始化人员对象
        
        Args:
            name: 人员姓名
            id: 人员ID（可选，不提供则自动生成）
            color: 颜色（可选，不提供则在服务层分配）
            createdAt: 创建时间戳（可选，不提供则使用当前时间）
            visible: 是否可见（默认True）
        """
        self.id = id or self._generate_id()
        self.name = name
        self.color = color  # 如果为None，在服务层分配
        self.createdAt = createdAt or self._get_current_timestamp()
        self.visible = visible if visible is not None else True
        
        # 验证数据
        self.validate()
    
    @staticmethod
    def _generate_id():
        """
        生成唯一的人员ID
        
        Returns:
            str: UUID格式的ID，带'owner-'前缀
        """
        return f"owner-{str(uuid.uuid4())}"
    
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
        验证人员数据的有效性
        
        Raises:
            ValueError: 数据验证失败
        """
        # 验证姓名
        if not self.name or not isinstance(self.name, str):
            raise ValueError("人员姓名必须是非空字符串")
        
        if not self.name.strip():
            raise ValueError("人员姓名不能为空白字符")
        
        if len(self.name) > 50:
            raise ValueError("人员姓名长度不能超过50个字符")
        
        # 验证颜色格式（如果提供）
        if self.color and not re.match(r'^#[0-9A-Fa-f]{6}$', self.color):
            raise ValueError("颜色格式必须是HEX格式（如#FF6B6B）")

        # 验证visible (必须是布尔值)
        if not isinstance(self.visible, bool):
             raise ValueError("visible必须是布尔值")
    
    def to_dict(self):
        """
        将人员对象转换为字典
        
        Returns:
            dict: 人员数据字典
        """
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'createdAt': self.createdAt,
            'visible': self.visible
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        从字典创建人员对象
        
        Args:
            data: 包含人员数据的字典
            
        Returns:
            Owner: 人员对象
        """
        return cls(
            name=data['name'],
            id=data.get('id'),
            color=data.get('color'),
            createdAt=data.get('createdAt'),
            visible=data.get('visible', True)
        )
    
    @staticmethod
    def generate_hsl_color(index):
        """
        使用HSL算法生成颜色
        用于超过预定义颜色池数量时动态生成颜色
        色相均匀分布，保证视觉区分度
        
        Args:
            index: 人员索引（从0开始）
            
        Returns:
            str: HEX格式的颜色
        """
        # 黄金角度分割，确保颜色均匀分布
        golden_ratio = 0.618033988749895
        hue = (index * golden_ratio) % 1.0
        
        # 固定饱和度和亮度，确保颜色鲜艳且可读
        saturation = 0.7
        lightness = 0.6
        
        # 转换HSL到RGB
        rgb = Owner._hsl_to_rgb(hue, saturation, lightness)
        
        # 转换RGB到HEX
        return Owner._rgb_to_hex(rgb)
    
    @staticmethod
    def _hsl_to_rgb(h, s, l):
        """
        HSL颜色空间转RGB颜色空间
        
        Args:
            h: 色相（0-1）
            s: 饱和度（0-1）
            l: 亮度（0-1）
            
        Returns:
            tuple: (r, g, b) 每个值范围0-255
        """
        def hue_to_rgb(p, q, t):
            if t < 0:
                t += 1
            if t > 1:
                t -= 1
            if t < 1/6:
                return p + (q - p) * 6 * t
            if t < 1/2:
                return q
            if t < 2/3:
                return p + (q - p) * (2/3 - t) * 6
            return p
        
        if s == 0:
            # 无饱和度时为灰色
            r = g = b = l
        else:
            q = l * (1 + s) if l < 0.5 else l + s - l * s
            p = 2 * l - q
            r = hue_to_rgb(p, q, h + 1/3)
            g = hue_to_rgb(p, q, h)
            b = hue_to_rgb(p, q, h - 1/3)
        
        return (int(r * 255), int(g * 255), int(b * 255))
    
    @staticmethod
    def _rgb_to_hex(rgb):
        """
        RGB转HEX格式
        
        Args:
            rgb: (r, g, b) 元组，每个值范围0-255
            
        Returns:
            str: HEX格式颜色，如#FF6B6B
        """
        return '#{:02X}{:02X}{:02X}'.format(rgb[0], rgb[1], rgb[2])
