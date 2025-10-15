"""
产品线服务层
处理产品线相关的业务逻辑
"""
from models.productline import ProductLine
from utils.file_handler import read_json_file, write_json_file, get_data_file_path


class ProductLineService:
    """
    产品线服务类
    提供产品线的CRUD操作
    """
    
    def __init__(self):
        """初始化服务，设置数据文件路径"""
        self.data_file = get_data_file_path('productlines.json')
    
    def get_all(self):
        """
        获取所有产品线
        
        Returns:
            list: 产品线列表
        """
        data = read_json_file(self.data_file)
        return data.get('productlines', [])
    
    def get_by_id(self, productline_id):
        """
        根据ID获取产品线
        
        Args:
            productline_id: 产品线ID
            
        Returns:
            dict: 产品线数据，如果不存在返回None
        """
        productlines = self.get_all()
        for pl in productlines:
            if pl['id'] == productline_id:
                return pl
        return None
    
    def create(self, name):
        """
        创建新产品线
        
        Args:
            name: 产品线名称
            
        Returns:
            dict: 创建的产品线数据
            
        Raises:
            ValueError: 数据验证失败
        """
        # 创建产品线对象（会自动验证）
        productline = ProductLine(name=name)
        
        # 读取现有数据
        data = read_json_file(self.data_file)
        productlines = data.get('productlines', [])
        
        # 检查名称是否已存在
        for pl in productlines:
            if pl['name'] == name:
                raise ValueError(f"产品线名称已存在: {name}")
        
        # 添加新产品线
        productlines.append(productline.to_dict())
        data['productlines'] = productlines
        
        # 保存到文件
        write_json_file(self.data_file, data)
        
        return productline.to_dict()
    
    def delete(self, productline_id):
        """
        删除产品线
        
        Args:
            productline_id: 产品线ID
            
        Returns:
            bool: 删除成功返回True，产品线不存在返回False
        """
        data = read_json_file(self.data_file)
        productlines = data.get('productlines', [])
        
        # 查找并删除
        original_length = len(productlines)
        productlines = [pl for pl in productlines if pl['id'] != productline_id]
        
        if len(productlines) == original_length:
            return False  # 未找到要删除的产品线
        
        data['productlines'] = productlines
        write_json_file(self.data_file, data)
        
        return True
