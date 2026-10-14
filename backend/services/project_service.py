"""项目服务：在同一文件事务中校验和保存项目变更。"""
from models.project import Project
from utils.file_handler import read_json_file, mutate_json_file, get_data_file_path
from services.placement_service import apply_move, resolve_project_row


class ProjectService:
    def __init__(self):
        self.data_file = get_data_file_path('projects.json')
        self.productlines_file = get_data_file_path('productlines.json')

    def get_all(self):
        return read_json_file(self.data_file).get('projects', [])

    def get_by_id(self, project_id):
        return next((project for project in self.get_all() if project['id'] == project_id), None)

    def _validate_product_line(self, product_line_id):
        lines = read_json_file(self.productlines_file).get('productlines', [])
        if not any(line['id'] == product_line_id for line in lines):
            raise ValueError('目标产品线不存在')

    def create(self, name, productLineId, ownerId, startDate, endDate, status,
               isPending=False, remarks='', layoutRow=None):
        project = Project(name=name, productLineId=productLineId, ownerId=ownerId,
                          startDate=startDate, endDate=endDate, status=status,
                          isPending=isPending, remarks=remarks, layoutRow=layoutRow)

        def mutation(data):
            self._validate_product_line(project.productLineId)
            projects = data.setdefault('projects', [])
            resolve_project_row(project, projects)
            projects.append(project.to_dict())
            return project.to_dict()

        return mutate_json_file(self.data_file, mutation)

    def update(self, project_id, **kwargs):
        def mutation(data):
            projects = data.get('projects', [])
            for index, original in enumerate(projects):
                if original['id'] != project_id:
                    continue
                project = Project.from_dict(original)
                project.update(**kwargs)
                self._validate_product_line(project.productLineId)
                resolve_project_row(project, projects)
                projects[index] = project.to_dict()
                return project.to_dict()
            return None

        return mutate_json_file(self.data_file, mutation)

    def move(self, project_id, payload):
        def mutation(data):
            product_lines = read_json_file(self.productlines_file).get('productlines', [])
            return apply_move(data.get('projects', []), project_id, payload, product_lines)

        return mutate_json_file(self.data_file, mutation)

    def delete(self, project_id):
        def mutation(data):
            projects = data.get('projects', [])
            filtered = [project for project in projects if project['id'] != project_id]
            data['projects'] = filtered
            return len(filtered) != len(projects)

        return mutate_json_file(self.data_file, mutation)
