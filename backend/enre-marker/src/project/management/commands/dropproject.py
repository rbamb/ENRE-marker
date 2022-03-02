import sys

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from project.models import Project, File, Entity, Relation


class Command(BaseCommand):
    help = 'Drop a project\'s data'

    def add_arguments(self, parser):
        parser.add_argument('pid', type=int)
        parser.add_argument('mode', type=str, nargs='?')

    def handle(self, *args, **options):
        pid = options['pid']
        mode = options['mode']

        try:
            proj = Project.objects.get(pid=pid)
        except Project.DoesNotExist:
            raise CommandError(f'Project with pid {pid} does not exist')

        self.stdout.write(f'Going to drop project with id={proj.pid} and name={proj.p_name}')
        self.stdout.write(f'To continue, type {proj.pid}/{proj.p_name} to confirm: ')
        if sys.stdin.readline().strip() != f'{proj.pid}/{proj.p_name}':
            raise CommandError('Confirm failed, please try again')

        if mode is None or mode == 'all':
            # Since Project->File->Entity->Relation are cascaded,
            # delete project will result in a total deletion of all data in that project
            proj.delete()
            self.stdout.write(self.style.SUCCESS(
                f'Successfully drop project with id={pid} and name={proj.p_name}'
            ))
        elif mode == 'data':
            File.objects.filter(pid=proj).delete()
            self.stdout.write(self.style.SUCCESS(
                f'Successfully drop project\'s data with id={pid} and name={proj.p_name}'
            ))
        else:
            raise CommandError(f'Unknown drop mode {mode}, usage: [all]/data')
