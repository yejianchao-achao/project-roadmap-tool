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
        获取所有产品线（按order排序）
        
        Returns:
            list: 产品线列表
        """
        data = read_json_file(self.data_file)
        productlines = data.get('productlines', [])
        
        # 数据迁移：为没有order字段的产品线添加order
        self._migrate_productline_order(productlines)
        
        # 按order排序
        productlines.sort(key=lambda x: x.get('order', 0))
        
        return productlines
    
    def _migrate_productline_order(self, productlines):
        """
        数据迁移：为没有order字段的产品线添加order
        
        Args:
            productlines: 产品线列表
        """
        needs_migration = False
        for i, pl in enumerate(productlines):
            if 'order' not in pl:
                pl['order'] = i
                needs_migration = True
        
        # 如果有数据需要迁移，保存到文件
        if needs_migration:
            data = {'productlines': productlines}
            write_json_file(self.data_file, data)
    
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
        创建新产品线（自动分配order）
        
        Args:
            name: 产品线名称
            
        Returns:
            dict: 创建的产品线数据
            
        Raises:
            ValueError: 数据验证失败
        """
        # 读取现有数据
        data = read_json_file(self.data_file)
        productlines = data.get('productlines', [])
        
        # 检查名称是否已存在
        for pl in productlines:
            if pl['name'] == name:
                raise ValueError(f"产品线名称已存在: {name}")
        
        # 计算新的order值（最大order + 1）
        max_order = max([pl.get('order', 0) for pl in productlines], default=-1)
        new_order = max_order + 1
        
        # 创建产品线对象（会自动验证）
        productline = ProductLine(name=name, order=new_order)
        
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
    
    def update(self, productline_id, name):
        """
        更新产品线名称
        
        Args:
            productline_id: 产品线ID
            name: 新的产品线名称
            
        Returns:
            dict: 更新后的产品线数据
            
        Raises:
            ValueError: 数据验证失败或名称重复
        """
        # 验证产品线是否存在
        productline = self.get_by_id(productline_id)
        if not productline:
            raise ValueError(f"产品线不存在: {productline_id}")
        
        # 创建ProductLine对象进行验证（会自动验证名称格式）
        ProductLine(name=name)
        
        # 读取现有数据
        data = read_json_file(self.data_file)
        productlines = data.get('productlines', [])
        
        # 检查名称是否与其他产品线重复（排除自己）
        for pl in productlines:
            if pl['id'] != productline_id and pl['name'] == name:
                raise ValueError(f"产品线名称已存在: {name}")
        
        # 更新产品线名称
        for pl in productlines:
            if pl['id'] == productline_id:
                pl['name'] = name
                break
        
        data['productlines'] = productlines
        
        # 保存到文件
        write_json_file(self.data_file, data)
        
        # 返回更新后的产品线数据
        return self.get_by_id(productline_id)
    
    def get_related_projects_count(self, productline_id):
        """
        获取产品线关联的项目数量
        
        Args:
            productline_id: 产品线ID
            
        Returns:
            int: 关联的项目数量
        """
        # 读取项目数据
        projects_file = get_data_file_path('projects.json')
        projects_data = read_json_file(projects_file)
        projects = projects_data.get('projects', [])
        
        # 统计productLineId等于指定ID的项目数量
        count = sum(1 for project in projects if project.get('productLineId') == productline_id)
        
        return count
    
    def delete_with_check(self, productline_id):
        """
        删除产品线（带关联检查）
        
        Args:
            productline_id: 产品线ID
            
        Returns:
            dict: 包含成功状态和消息
            
        Raises:
            ValueError: 产品线不存在
            PermissionError: 产品线有关联项目，无法删除
        """
        # 验证产品线是否存在
        productline = self.get_by_id(productline_id)
        if not productline:
            raise ValueError(f"产品线不存在: {productline_id}")
        
        # 检查是否有项目关联
        related_count = self.get_related_projects_count(productline_id)
        if related_count > 0:
            raise PermissionError(f"该产品线有{related_count}个关联项目，请先删除或迁移这些项目")
        
        # 执行删除
        success = self.delete(productline_id)
        if not success:
            raise ValueError(f"删除产品线失败: {productline_id}")
        
        return {
            'success': True,
            'message': '产品线删除成功'
        }
    
    def reorder(self, order_list):
        """
        批量更新产品线顺序
        
        Args:
            order_list: 排序列表 [{'id': 'pl-001', 'order': 0}, ...]
            
        Returns:
            list: 更新后的产品线列表
            
        Raises:
            ValueError: 参数验证失败
        """
        # 验证参数
        if not order_list or not isinstance(order_list, list):
            raise ValueError('orderList必须是非空数组')
        
        # 读取数据
        data = read_json_file(self.data_file)
        productlines = data.get('productlines', [])
        
        # 创建ID到order的映射
        order_map = {item['id']: item['order'] for item in order_list}
        
        # 更新order
        for pl in productlines:
            if pl['id'] in order_map:
                pl['order'] = order_map[pl['id']]
        
        # 保存数据
        data['productlines'] = productlines
        write_json_file(self.data_file, data)
        
        # 返回排序后的列表
        return self.get_all()
