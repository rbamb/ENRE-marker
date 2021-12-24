import sys

from django.core.management.base import BaseCommand, CommandError
from project.models import Project, File, Entity, Relation
import json
from pathlib import PureWindowsPath


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
        parser.add_argument('relation_json', type=str)

    def handle(self, *args, **options):
        pid = options['pid']
        ent_path = options['entity_json']
        rel_path = options['relation_json']

        try:
            proj = Project.objects.get(pid=pid)
        except Project.DoesNotExist:
            raise CommandError(f'Project with pid {pid} does not exist')

        self.stdout.write(f'Using project with id={proj.pid} and name={proj.p_name}')

        ent_data = load_json(ent_path)
        rel_data = load_json(rel_path)

        self.stdout.write('Importing entities...')
        file_type_index = get_file_type_index(proj.lang)
        file_map = {}
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
                    file_map[ent['id']] = f.fid
                    file_count += 1
                    # Also create corresponding entity for each file
                    e = Entity.objects.create(
                        fid=File.objects.get(fid=f.fid),
                        code_name=file_path.as_posix(),
                        entity_type=ent['type'],
                    )
                    id_map[ent['id']] = e.eid
                    ent_count += 1
            else:
                try:
                    e = Entity.objects.create(
                        fid=File.objects.get(fid=file_map[ent['belongs_to']]),
                        code_name=ent['name'],
                        entity_type=ent['type'],
                        loc_start_line=ent['start_line'],
                        loc_start_column=ent['start_column'],
                        loc_end_line=ent['end_line'],
                        loc_end_column=ent['end_column'],
                    )
                except KeyError:
                    e = Entity.objects.create(
                        fid=File.objects.get(fid=file_map[ent['belongs_to']]),
                        code_name=ent['name'],
                        entity_type=ent['type'],
                    )
                id_map[ent['id']] = e.eid
                ent_count += 1

        self.stdout.write('Importing relations...')
        rel_list = []
        for rel in rel_data:
            rel_list.append(Relation(
                from_entity=Entity.objects.get(eid=id_map[rel['from']]),
                to_entity=Entity.objects.get(eid=id_map[rel['to']]),
                relation_type=rel['type'],
                loc_line=rel['line'],
                loc_column=rel['column'],
            ))
        Relation.objects.bulk_create(rel_list)

        self.stdout.write(self.style.SUCCESS(
            f'Successfully add {file_count} file(s), {ent_count} entity(s) and {len(rel_list)} relation(s) to project with pid {pid} and name {proj.p_name}'
        ))
