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


class Command(BaseCommand):
    help = 'Fill a project\'s data'

    def add_arguments(self, parser):
        parser.add_argument('pid', type=int)
        parser.add_argument('entity_json', type=str)
        parser.add_argument('relation_json', type=str)

    def handle(self, *args, **options):
        pid = options['pid']
        epath = options['entity_json']
        rpath = options['relation_json']

        try:
            proj = Project.objects.get(pid=pid)
        except Project.DoesNotExist:
            raise CommandError(f'Project with pid {pid} does not exist')

        ejson = load_json(epath)
        rjson = load_json(rpath)

        flist = []
        for variable in rjson['variables']:
            # Convert Windows-styled path to *nix-styled path
            fpath = PureWindowsPath(variable)
            if fpath.is_absolute():
                raise CommandError(f'File path must be relative to it\'s root, whereas {fpath} is not')
            try:
                File.objects.get(file_path=fpath.as_posix(), pid=pid)
                raise CommandError(f'Duplicated file {fpath} in project {proj.p_name}')
            except File.DoesNotExist:
                flist.append(
                    File(
                        pid=proj,
                        file_path=fpath.as_posix(),
                    )
                )
        File.objects.bulk_create(flist)

        elist = []
        e_name_list = []
        for entity in ejson['entity']:
            efile = File.objects.get(
                file_path=PureWindowsPath(entity.get('entityFile')).as_posix(),
                pid=pid,
            )
            # TODO: Remove type converter since input json should handle this already
            etype = convert_entity_type(entity.get('entityType'))
            ename = entity.get('entityName')
            if ename not in e_name_list:
                e_name_list.append(ename)
                elist.append(
                    Entity(
                        fid=efile,
                        code_name=ename,
                        entity_type=etype,
                        loc_start_line=entity.get('start_line'),
                        # TODO: Remove add since column error should be handled by json itself
                        loc_start_column=entity.get('start_column') + 1,
                        loc_end_line=entity.get('end_line'),
                        loc_end_column=entity.get('end_column') + 2,
                    )
                )
        Entity.objects.bulk_create(elist)

        cells = rjson['cells']
        rlist = []
        r_dict = defaultdict(list)
        for cell in cells:
            for detail in cell['details']:
                relation_type = convert_relation_type(detail.get('type'))

                src_file = File.objects.get(
                    file_path=PureWindowsPath(detail.get('src').get('file')).as_posix(),
                    pid=pid,
                )
                src_entity_type = convert_entity_type(detail.get('src').get('kind'))
                try:
                    src_entity = Entity.objects.get(
                        fid=src_file,
                        entity_type=src_entity_type,
                        code_name=detail.get('src').get('object'),
                    )
                except Entity.DoesNotExist:
                    src_entity = Entity.objects.create(
                        fid=src_file,
                        entity_type=src_entity_type,
                        code_name=detail.get('src').get('object'),
                        loc_start_line=-1,
                        loc_start_column=-1,
                        loc_end_line=-1,
                        loc_end_column=-1,
                    )

                dest_file = File.objects.get(
                    file_path=PureWindowsPath(detail.get('dest').get('file')).as_posix(),
                    pid=pid
                )
                dest_entity_type = convert_entity_type(detail.get('dest').get('kind'))
                try:
                    dest_entity = Entity.objects.get(
                        fid=dest_file,
                        entity_type=dest_entity_type,
                        code_name=detail.get('dest').get('object'),
                    )
                except Entity.DoesNotExist:
                    dest_entity = Entity.objects.create(
                        fid=dest_file,
                        entity_type=dest_entity_type,
                        code_name=detail.get('dest').get('object'),
                        loc_start_line=-1,
                        loc_start_column=-1,
                        loc_end_line=-1,
                        loc_end_column=-1,
                    )

                if src_entity.code_name in r_dict.keys():
                    if (dest_entity.code_name, relation_type) in r_dict[src_entity.code_name]:
                        continue
                else:
                    r_dict[src_entity.code_name].append((dest_entity.code_name, relation_type))
                    r = Relation()
                    r.relation_type = relation_type
                    r.from_entity = src_entity
                    r.to_entity = dest_entity
                    rlist.append(r)
        Relation.objects.bulk_create(rlist)

        self.stdout.write(self.style.SUCCESS(
            f'Successfully add {len(flist)} file(s), {len(elist)} entity(s) and {len(rlist)} relation(s) to project with pid {pid} and name {proj.p_name}'
        ))
