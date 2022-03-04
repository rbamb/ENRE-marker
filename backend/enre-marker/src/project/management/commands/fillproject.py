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

        # Prefetch all file entities
        file_type_index = get_file_type_index(proj.lang)
        ent_file_data = list(filter(lambda item: item['type'] == file_type_index, ent_data))
        ent_other_data = list(filter(lambda item: item['type'] != file_type_index, ent_data))

        self.stdout.write('Importing entities...')
        file_map = {}
        id_map = {}
        file_count = 0
        ent_count = 0

        # Pending list for ALL entities that are being inserted, pending for bulk_create
        pending_list = []
        # Process file entities first (to save files info in file table)
        for ent in ent_file_data:
            file_path = PureWindowsPath(ent['name'])
            if file_path.is_absolute():
                raise CommandError(f'File path must be relative to it\'s root, whereas {file_path} is not')
            try:
                File.objects.get(file_path=file_path.as_posix(), pid=proj.pid)
                # TODO: Continue insertion mode
                raise CommandError(f'Duplicated file {file_path} in project {proj.p_name}')
            except File.DoesNotExist:
                f = File.objects.create(
                    pid=proj,
                    file_path=file_path.as_posix(),
                )
                file_map[ent['id']] = f.fid
                file_count += 1
                # Also create corresponding entity for each file
                pending_list.append(Entity(
                    fid=File.objects.get(fid=f.fid),
                    code_name=file_path.as_posix(),
                    entity_type=ent['type'],
                ))
                ent_count += 1
        # Process other entities then
        for ent in ent_other_data:
            try:
                pending_list.append(Entity(
                    fid=File.objects.get(fid=file_map[ent['belongs_to']]),
                    code_name=ent['name'],
                    entity_type=ent['type'],
                    loc_start_line=ent['start_line'],
                    loc_start_column=ent['start_column'],
                    loc_end_line=ent['end_line'],
                    loc_end_column=ent['end_column'],
                ))
            except KeyError:
                # KeyError indicates that an entity doesn't have loc info
                pending_list.append(Entity(
                    fid=File.objects.get(fid=file_map[ent['belongs_to']]),
                    code_name=ent['name'],
                    entity_type=ent['type'],
                ))
            ent_count += 1

        # Bulk create all entities, and since the results are in the same order as they are while appending,
        # so re-iterate over all entities to generate the id map for relation insertion to use
        res = Entity.objects.bulk_create(pending_list)
        for i, ent in enumerate(ent_file_data + ent_other_data):
            # WARNING: This feature only works with django>=4.0
            id_map[ent['id']] = res[i].eid

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
