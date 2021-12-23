import sys

from django.core.management.base import BaseCommand, CommandError
from project.models import Project, File, Entity, Relation
import json
from pathlib import PureWindowsPath
from collections import defaultdict

from project.tools import convert_entity_type, convert_relation_type


def load_json(filepath):
    f = open(filepath, 'r', encoding='utf-8')
    s = f.read()
    # TODO: Reformat with stream
    data = json.loads(s)
    return data


def get_file_type_index(lang):
    if lang == 'java':
        return 7
    else:
        print(f'Unknown lang {lang}')
        sys.exit(-1)


class Command(BaseCommand):
    help = 'Fill a project\'s data'

    def add_arguments(self, parser):
        parser.add_argument('pid', type=int)
        parser.add_argument('entity_json', type=str)
        # parser.add_argument('relation_json', type=str)

    def handle(self, *args, **options):
        pid = options['pid']
        ent_path = options['entity_json']
        # rel_path = options['relation_json']

        try:
            proj = Project.objects.get(pid=pid)
        except Project.DoesNotExist:
            raise CommandError(f'Project with pid {pid} does not exist')

        ent_data = load_json(ent_path)
        # rel_data = load_json(rel_path)

        file_type_index = get_file_type_index(proj.lang)
        id_map = {}
        file_count = 0
        ent_count = 0
        for ent in ent_data:
            if ent['type'] == file_type_index:
                file_path = PureWindowsPath(ent['name'])
                if file_path.is_absolute():
                    raise CommandError(f'File path must be relative to it\'s root, whereas {file_path} is not')
                try:
                    File.objects.get(file_path=file_path.as_posix(), pid=proj.pid)
                    raise CommandError(f'Duplicated file {file_path} in project {proj.p_name}')
                except File.DoesNotExist:
                    f = File.objects.create(
                        pid=proj,
                        file_path=file_path.as_posix(),
                    )
                    id_map[ent['id']] = f.fid
                    file_count += 1
            else:
                try:
                    e = Entity.objects.create(
                        fid=File.objects.get(fid=id_map[ent['belongs_to']]),
                        code_name=ent['name'],
                        entity_type=ent['type'],
                        loc_start_line=ent['start_line'],
                        loc_start_column=ent['start_column'],
                        loc_end_line=ent['end_line'],
                        loc_end_column=ent['end_column'],
                    )
                except KeyError:
                    e = Entity.objects.create(
                        fid=File.objects.get(fid=id_map[ent['belongs_to']]),
                        code_name=ent['name'],
                        entity_type=ent['type'],
                        loc_start_line=-1,
                        loc_start_column=-1,
                        loc_end_line=-1,
                        loc_end_column=-1,
                    )
                id_map[ent['id']] = e.eid
                ent_count += 1


        # ent_list = []
        # e_name_list = []
        # for entity in ejson['entity']:
        #     efile = File.objects.get(
        #         file_path=PureWindowsPath(entity.get('entityFile')).as_posix(),
        #         pid=pid,
        #     )
        #     # TODO: Remove type converter since input json should handle this already
        #     etype = convert_entity_type(entity.get('entityType'))
        #     ename = entity.get('entityName')
        #     if ename not in e_name_list:
        #         e_name_list.append(ename)
        #         elist.append(
        #             Entity(
        #                 fid=efile,
        #                 code_name=ename,
        #                 entity_type=etype,
        #                 loc_start_line=entity.get('start_line'),
        #                 loc_start_column=entity.get('start_column'),
        #                 loc_end_line=entity.get('end_line'),
        #                 loc_end_column=entity.get('end_column'),
        #             )
        #         )
        # Entity.objects.bulk_create(elist)

        # cells = rjson['cells']
        rel_list = []
        # r_dict = defaultdict(list)
        # for cell in cells:
        #     for detail in cell['details']:
        #         relation_type = convert_relation_type(detail.get('type'))
        #
        #         src_file = File.objects.get(
        #             file_path=PureWindowsPath(detail.get('src').get('file')).as_posix(),
        #             pid=pid,
        #         )
        #         src_entity_type = convert_entity_type(detail.get('src').get('kind'))
        #         try:
        #             src_entity = Entity.objects.get(
        #                 fid=src_file,
        #                 entity_type=src_entity_type,
        #                 code_name=detail.get('src').get('object'),
        #             )
        #         except Entity.DoesNotExist:
        #             src_entity = Entity.objects.create(
        #                 fid=src_file,
        #                 entity_type=src_entity_type,
        #                 code_name=detail.get('src').get('object'),
        #                 loc_start_line=-1,
        #                 loc_start_column=-1,
        #                 loc_end_line=-1,
        #                 loc_end_column=-1,
        #             )
        #
        #         dest_file = File.objects.get(
        #             file_path=PureWindowsPath(detail.get('dest').get('file')).as_posix(),
        #             pid=pid
        #         )
        #         dest_entity_type = convert_entity_type(detail.get('dest').get('kind'))
        #         try:
        #             dest_entity = Entity.objects.get(
        #                 fid=dest_file,
        #                 entity_type=dest_entity_type,
        #                 code_name=detail.get('dest').get('object'),
        #             )
        #         except Entity.DoesNotExist:
        #             dest_entity = Entity.objects.create(
        #                 fid=dest_file,
        #                 entity_type=dest_entity_type,
        #                 code_name=detail.get('dest').get('object'),
        #                 loc_start_line=-1,
        #                 loc_start_column=-1,
        #                 loc_end_line=-1,
        #                 loc_end_column=-1,
        #             )
        #
        #         if src_entity.code_name in r_dict.keys():
        #             if (dest_entity.code_name, relation_type) in r_dict[src_entity.code_name]:
        #                 continue
        #         else:
        #             r_dict[src_entity.code_name].append((dest_entity.code_name, relation_type))
        #             r = Relation()
        #             r.relation_type = relation_type
        #             r.from_entity = src_entity
        #             r.to_entity = dest_entity
        #             rlist.append(r)
        # Relation.objects.bulk_create(rlist)

        self.stdout.write(self.style.SUCCESS(
            f'Successfully add {file_count} file(s), {ent_count} entity(s) and {len(rel_list)} relation(s) to project with pid {pid} and name {proj.p_name}'
        ))
