import sys

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from project.models import Project, File, Entity, Relation
import json


def load_json(filepath):
    f = open(filepath, 'r', encoding='utf-8')
    s = f.read()
    # TODO: Reformat with stream
    data = json.loads(s)
    return data


def entity_type_str2int_java(str):
    array = ['Unknown', 'Variable', 'Method', 'Interface', 'Annotation', 'Enum', 'Class', 'File', 'Package', 'Module', 'TypeVariable']
    return array.index(str)


# Format input enre-styled json object to standard marker format
def formatting(lang, raw):
    if lang == 'java':
        raw_entity = raw.get('variables')
        raw_relation = raw.get('cells')

        build_entity = []
        build_relation = []

        for ent in raw_entity:
            if ent.get('external'):
                continue

            tmp = {
                'id': ent.get('id'),
                'type': entity_type_str2int_java(ent.get('category')),
                'name': ent.get('qualifiedName'),
            }

            # Indicates that this entity has location info
            if ent.get('startLine'):
                pass

            build_entity.append(tmp)

    else:
        print(f'Unknown lang {lang}')
        sys.exit(-1)


class Command(BaseCommand):
    help = 'Pre mark a project\'s data using ENRE\' output'

    def add_arguments(self, parser):
        parser.add_argument('pid', type=int)
        parser.add_argument('ENRE_output_json', type=str)

    def handle(self, *args, **options):
        pid = options['pid']

        try:
            proj = Project.objects.get(pid=pid)
        except Project.DoesNotExist:
            raise CommandError(f'Project with pid {pid} does not exist')

        enre_entity, enre_relation = formatting(proj.lang, load_json(options['ENRE_output_json']))

        self.stdout.write(f'Going to drop project with id={proj.pid} and name={proj.p_name}')
        self.stdout.write(f'To continue, type {proj.pid}/{proj.p_name} to confirm: ')
        if sys.stdin.readline().strip() != f'{proj.pid}/{proj.p_name}':
            raise CommandError('Confirm failed, please try again')
