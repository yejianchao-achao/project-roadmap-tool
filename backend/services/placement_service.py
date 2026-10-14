"""Placement validation shared by project writes and the drag endpoint."""
from datetime import datetime


class PlacementConflict(ValueError):
    pass


def overlaps(first, second):
    return first['startDate'] <= second['endDate'] and second['startDate'] <= first['endDate']


def nearest_free_row(project, placements, preferred):
    occupied = {item['row'] for item in placements if item['id'] != project['id'] and overlaps(project, item)}
    for distance in range(len(occupied) + 1):
        candidates = [preferred] if distance == 0 else [preferred + distance, preferred - distance]
        for row in candidates:
            if 0 <= row <= 10000 and row not in occupied:
                return row
    raise ValueError('没有可用布局行')


def assigned_rows(projects):
    result = []
    for project in sorted(projects, key=lambda p: (p.get('layoutRow') is None, p['startDate'])):
        row = nearest_free_row(project, result, project.get('layoutRow') or 0)
        result.append({**project, 'row': row})
    return result


def resolve_project_row(project, projects):
    if project.layoutRow is None:
        return
    others = [item for item in projects if item['id'] != project.id and item['productLineId'] == project.productLineId]
    project.layoutRow = nearest_free_row(project.to_dict(), assigned_rows(others), project.layoutRow)


def apply_move(projects, project_id, payload, product_lines):
    if any(not isinstance(payload[field], str) for field in ('startDate', 'endDate', 'productLineId')) or type(payload['expectedUpdatedAt']) is not int:
        raise ValueError('日期、产品线或项目版本格式无效')
    original = next((item for item in projects if item['id'] == project_id), None)
    if original is None:
        raise PlacementConflict('项目已删除，请刷新后重试')
    if payload['expectedUpdatedAt'] != original['updatedAt']:
        raise PlacementConflict('项目已被修改，请刷新后重试')
    if payload['productLineId'] not in {line['id'] for line in product_lines}:
        raise ValueError('目标产品线不存在')
    preferred = payload['preferredRow']
    if type(preferred) is not int or not 0 <= preferred <= 10000:
        raise ValueError('期望行号无效')
    assignments = payload['rowAssignments']
    if not isinstance(assignments, list):
        raise ValueError('布局快照无效')
    affected = [item for item in projects if item['productLineId'] in {original['productLineId'], payload['productLineId']}]
    by_id = {}
    for assignment in assignments:
        if not isinstance(assignment, dict) or not {'id', 'row', 'updatedAt'} <= assignment.keys():
            raise ValueError('布局快照无效')
        if not isinstance(assignment['id'], str) or type(assignment['updatedAt']) is not int:
            raise ValueError('布局快照项目或版本无效')
        if type(assignment['row']) is not int or not 0 <= assignment['row'] <= 10000:
            raise ValueError('布局快照行号无效')
        if assignment['id'] in by_id:
            raise ValueError('布局快照项目重复')
        by_id[assignment['id']] = assignment
    if set(by_id) != {item['id'] for item in affected} or any(by_id[item['id']]['updatedAt'] != item['updatedAt'] for item in affected):
        raise PlacementConflict('相关产品线已更新，请刷新后重试')
    placed = [{**item, 'row': by_id[item['id']]['row']} for item in affected]
    for index, first in enumerate(placed):
        for second in placed[index + 1:]:
            if first['productLineId'] == second['productLineId'] and first['row'] == second['row'] and overlaps(first, second):
                raise PlacementConflict('布局已变化，请刷新后重试')

    from models.project import Project
    moved = Project.from_dict(original)
    moved.update(startDate=payload['startDate'], endDate=payload['endDate'], productLineId=payload['productLineId'])
    duration = lambda start, end: (datetime.strptime(end, '%Y-%m-%d') - datetime.strptime(start, '%Y-%m-%d')).days
    if duration(moved.startDate, moved.endDate) != duration(original['startDate'], original['endDate']):
        raise ValueError('拖动必须保持工期不变')
    target = [item for item in placed if item['productLineId'] == moved.productLineId and item['id'] != project_id]
    moved.layoutRow = nearest_free_row(moved.to_dict(), target, preferred)
    moved.validate()
    for item in projects:
        if item['id'] == project_id:
            item.update(moved.to_dict())
        elif item['id'] in by_id and item.get('layoutRow') != by_id[item['id']]['row']:
            item['layoutRow'] = by_id[item['id']]['row']
            item['updatedAt'] = max(moved.updatedAt, item['updatedAt'] + 1)
    return {'project': moved.to_dict(), 'projects': projects}
