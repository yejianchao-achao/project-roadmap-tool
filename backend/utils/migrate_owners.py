"""
数据迁移工具
为现有项目添加ownerId字段
"""
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import owner_service, project_service
from utils.file_handler import read_json_file, write_json_file


def migrate_owner_data():
    """
    数据迁移：为现有项目添加ownerId字段
    
    迁移步骤：
    1. 确保owners.json存在
    2. 确保默认人员存在
    3. 为没有ownerId的项目分配默认人员
    
    Returns:
        dict: 迁移结果统计
    """
    print("=" * 60)
    print("开始数据迁移：项目负责人字段")
    print("=" * 60)
    
    result = {
        'success': False,
        'owners_file_created': False,
        'default_owner_created': False,
        'projects_migrated': 0,
        'total_projects': 0,
        'errors': []
    }
    
    try:
        # 步骤1：确保owners.json存在
        print("\n[步骤1] 检查owners.json文件...")
        if not os.path.exists('data/owners.json'):
            print("  - owners.json不存在，正在创建...")
            owner_service.initialize_owners_file()
            result['owners_file_created'] = True
            print("  ✓ owners.json创建成功")
        else:
            print("  ✓ owners.json已存在")
        
        # 步骤2：确保默认人员存在
        print("\n[步骤2] 检查默认人员...")
        default_owner = owner_service.get_owner_by_id('owner-default')
        if not default_owner:
            print("  - 默认人员不存在，正在创建...")
            default_owner = owner_service.create_default_owner()
            result['default_owner_created'] = True
            print(f"  ✓ 默认人员创建成功: {default_owner.name} ({default_owner.id})")
        else:
            print(f"  ✓ 默认人员已存在: {default_owner.name} ({default_owner.id})")
        
        # 步骤3：迁移项目数据
        print("\n[步骤3] 迁移项目数据...")
        
        # 读取项目数据文件
        projects_file = 'data/projects.json'
        if not os.path.exists(projects_file):
            print("  - 项目文件不存在，跳过迁移")
            result['success'] = True
            return result
        
        # 读取原始数据
        projects_data = read_json_file(projects_file)
        projects_list = projects_data.get('projects', [])
        result['total_projects'] = len(projects_list)
        
        print(f"  - 找到 {result['total_projects']} 个项目")
        
        # 检查并更新每个项目
        migrated_count = 0
        for project_dict in projects_list:
            project_id = project_dict.get('id', 'unknown')
            project_name = project_dict.get('name', 'unknown')
            
            # 检查是否已有ownerId
            if 'ownerId' not in project_dict or not project_dict['ownerId']:
                # 添加默认人员ID
                project_dict['ownerId'] = default_owner.id
                migrated_count += 1
                print(f"  - 迁移项目: {project_name} ({project_id})")
        
        # 保存更新后的数据
        if migrated_count > 0:
            write_json_file(projects_file, projects_data)
            result['projects_migrated'] = migrated_count
            print(f"\n  ✓ 成功迁移 {migrated_count} 个项目")
        else:
            print("  ✓ 所有项目已有负责人，无需迁移")
        
        result['success'] = True
        
    except Exception as e:
        error_msg = f"迁移失败: {str(e)}"
        result['errors'].append(error_msg)
        print(f"\n  ✗ {error_msg}")
        import traceback
        traceback.print_exc()
    
    # 打印迁移总结
    print("\n" + "=" * 60)
    print("迁移总结")
    print("=" * 60)
    print(f"状态: {'成功' if result['success'] else '失败'}")
    print(f"owners.json创建: {'是' if result['owners_file_created'] else '否'}")
    print(f"默认人员创建: {'是' if result['default_owner_created'] else '否'}")
    print(f"项目总数: {result['total_projects']}")
    print(f"迁移项目数: {result['projects_migrated']}")
    
    if result['errors']:
        print(f"\n错误信息:")
        for error in result['errors']:
            print(f"  - {error}")
    
    print("=" * 60)
    
    return result


def check_migration_needed():
    """
    检查是否需要执行迁移
    
    Returns:
        bool: 需要迁移返回True，否则返回False
    """
    # 检查owners.json是否存在
    if not os.path.exists('data/owners.json'):
        return True
    
    # 检查是否有项目缺少ownerId
    try:
        projects_file = 'data/projects.json'
        if not os.path.exists(projects_file):
            return False
        
        projects_data = read_json_file(projects_file)
        projects_list = projects_data.get('projects', [])
        
        for project_dict in projects_list:
            if 'ownerId' not in project_dict or not project_dict['ownerId']:
                return True
        
        return False
    except Exception:
        # 出错时保守策略：执行迁移
        return True


if __name__ == '__main__':
    """
    直接运行此脚本进行数据迁移
    """
    result = migrate_owner_data()
    
    # 返回退出码
    sys.exit(0 if result['success'] else 1)
