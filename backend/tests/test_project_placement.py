import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import app
from routes.projects import service


def project(identifier, line='a', row=None, start='2026-10-14', end='2026-10-21'):
    return dict(id=identifier, name=identifier, productLineId=line, ownerId='owner-default',
                startDate=start, endDate=end, status='规划', isPending=False, remarks='',
                createdAt=1, updatedAt=1, **({} if row is None else {'layoutRow': row}))


class PlacementTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.before_paths = service.data_file, service.productlines_file
        self.addCleanup(self.restore_paths)
        service.data_file = os.path.join(self.directory.name, 'projects.json')
        service.productlines_file = os.path.join(self.directory.name, 'productlines.json')
        Path(service.productlines_file).write_text(json.dumps({'productlines': [{'id': 'a'}, {'id': 'b'}, {'id': 'empty'}]}))
        self.seed([project('moving'), project('occupied', 'b', 0), project('below', 'b', 1)])
        self.client = app.test_client()

    def restore_paths(self):
        service.data_file, service.productlines_file = self.before_paths

    def seed(self, projects):
        Path(service.data_file).write_text(json.dumps({'projects': projects}))

    def payload(self, **overrides):
        data = dict(startDate='2026-10-16', endDate='2026-10-23', productLineId='b', preferredRow=0,
                    expectedUpdatedAt=1, rowAssignments=[{'id': 'moving', 'row': 0, 'updatedAt': 1},
                    {'id': 'occupied', 'row': 0, 'updatedAt': 1}, {'id': 'below', 'row': 1, 'updatedAt': 1}])
        data.update(overrides)
        return data

    def move(self, payload):
        return self.client.put('/api/projects/moving/move', json=payload)

    def test_cross_line_move_preserves_duration_finds_free_row_and_persists(self):
        response = self.move(self.payload())
        self.assertEqual(response.status_code, 200)
        moved = response.json['data']['project']
        self.assertEqual((moved['productLineId'], moved['startDate'], moved['endDate'], moved['layoutRow']), ('b', '2026-10-16', '2026-10-23', 2))
        self.assertEqual(service.get_by_id('moving'), moved)
        self.assertEqual(moved['ownerId'], 'owner-default')
        self.assertEqual(service.get_by_id('occupied')['layoutRow'], 0)

    def test_empty_line_and_legacy_records(self):
        response = self.move(self.payload(productLineId='empty', rowAssignments=[{'id': 'moving', 'row': 0, 'updatedAt': 1}]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['data']['project']['layoutRow'], 0)

    def test_stale_moved_or_neighbor_snapshot_is_rejected_without_writes(self):
        stale_neighbor = self.payload()
        stale_neighbor['rowAssignments'][1]['updatedAt'] = 0
        for payload in [self.payload(expectedUpdatedAt=0), stale_neighbor, self.payload(rowAssignments=[{'id': 'moving', 'row': 0, 'updatedAt': 1}])]:
            before = Path(service.data_file).read_bytes()
            self.assertEqual(self.move(payload).status_code, 409)
            self.assertEqual(Path(service.data_file).read_bytes(), before)

    def test_invalid_move_is_rejected_without_writes(self):
        for changes in [dict(endDate='2026-10-24'), dict(productLineId='deleted'), dict(preferredRow=-1), dict(preferredRow=True), dict(startDate=None)]:
            before = Path(service.data_file).read_bytes()
            self.assertEqual(self.move(self.payload(**changes)).status_code, 400)
            self.assertEqual(Path(service.data_file).read_bytes(), before)

    def test_save_failure_leaves_original_file_intact(self):
        before = Path(service.data_file).read_bytes()
        with patch('utils.file_handler.os.replace', side_effect=OSError('disk failure')):
            self.assertEqual(self.move(self.payload()).status_code, 500)
        self.assertEqual(Path(service.data_file).read_bytes(), before)
        self.assertEqual(list(Path(self.directory.name).glob('.projects-*')), [])

    def test_form_edit_keeps_manual_row_and_create_finds_available_row(self):
        self.assertEqual(self.move(self.payload()).status_code, 200)
        response = self.client.put('/api/projects/moving', json={'name': '改名'})
        self.assertEqual(response.json['data']['layoutRow'], 2)
        data = project('new', 'b', 0)
        response = self.client.post('/api/projects', json=data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json['data']['layoutRow'], 3)

    def test_same_line_vertical_move_fixes_other_rows(self):
        self.seed([project('moving'), project('other', row=1)])
        payload = self.payload(productLineId='a', preferredRow=1, startDate='2026-10-14', endDate='2026-10-21', rowAssignments=[
            {'id': 'moving', 'row': 0, 'updatedAt': 1}, {'id': 'other', 'row': 1, 'updatedAt': 1}])
        response = self.move(payload)
        self.assertEqual(response.json['data']['project']['layoutRow'], 2)
        self.assertEqual(service.get_by_id('other')['layoutRow'], 1)


if __name__ == '__main__':
    unittest.main()
