"""
项目服务层
处理项目相关的业务逻辑
"""
from models.project import Project
from utils.file_handler import read_json_file, write_json_file, get_data_file_path


class ProjectService:
    """
    项目服务类
    提供项目的CRUD操作
    """
    
    def __init__(self):
        """初始化服务，设置数据文件路径"""
        self.data_file = get_data_file_path('projects.json')
    
    def get_all(self):
        """
        获取所有项目
        
        Returns:
            list: 项目列表
        """
        data = read_json_file(self.data_file)
        return data.get('projects', [])
    
    def get_by_id(self, project_id):
        """
        根据ID获取项目
        
        Args:
            project_id: 项目ID
            
        Returns:
            dict: 项目数据，如果不存在返回None
        """
        projects = self.get_all()
        for project in projects:
            if project['id'] == project_id:
                return project
        return None
    
    def create(self, name, productLineId, startDate, endDate, status):
        """
        创建新项目
        
        Args:
            name: 项目名称
            productLineId: 所属产品线ID
            startDate: 开始日期（YYYY-MM-DD）
            endDate: 结束日期（YYYY-MM-DD）
            status: 项目状态
            
        Returns:
            dict: 创建的项目数据
            
        Raises:
            ValueError: 数据验证失败
        """
        # 创建项目对象（会自动验证）
        project = Project(
            name=name,
            productLineId=productLineId,
            startDate=startDate,
            endDate=endDate,
            status=status
        )
        
        # 读取现有数据
        data = read_json_file(self.data_file)
        projects = data.get('projects', [])
        
        # 添加新项目
        projects.append(project.to_dict())
        data['projects'] = projects
        
        # 保存到文件
        write_json_file(self.data_file, data)
        
        return project.to_dict()
    
    def update(self, project_id, **kwargs):
        """
        更新项目
        
        Args:
            project_id: 项目ID
            **kwargs: 要更新的字段
            
        Returns:
            dict: 更新后的项目数据，如果项目不存在返回None
            
        Raises:
            ValueError: 数据验证失败
        """
        data = read_json_file(self.data_file)
        projects = data.get('projects', [])
        
        # 查找项目
        project_index = None
        for i, proj in enumerate(projects):
            if proj['id'] == project_id:
                project_index = i
                break
        
        if project_index is None:
            return None
        
        # 创建项目对象并更新
        project = Project.from_dict(projects[project_index])
        project.update(**kwargs)
        
        # 更新列表
        projects[project_index] = project.to_dict()
        data['projects'] = projects
        
        # 保存到文件
        write_json_file(self.data_file, data)
        
        return project.to_dict()
    
    def delete(self, project_id):
        """
        删除项目
        
        Args:
            project_id: 项目ID
            
        Returns:
            bool: 删除成功返回True，项目不存在返回False
        """
        data = read_json_file(self.data_file)
        projects = data.get('projects', [])
        
        # 查找并删除
        original_length = len(projects)
        projects = [proj for proj in projects if proj['id'] != project_id]
        
        if len(projects) == original_length:
            return False  # 未找到要删除的项目
        
        data['projects'] = projects
        write_json_file(self.data_file, data)
        
        return True
