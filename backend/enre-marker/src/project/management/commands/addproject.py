from django.core.management.base import BaseCommand, CommandError
from project.models import Project


class Command(BaseCommand):
    help = 'Add a project'

    def add_arguments(self, parser):
        parser.add_argument('name', type=str)
        parser.add_argument('url', type=str)
        parser.add_argument('version', type=str)
        parser.add_argument('lang', type=str)
        parser.add_argument('branch', type=str, nargs='?')

    def handle(self, *args, **options):
        name = options['name']
        url = options['url']
        version = options['version']
        lang = options['lang']
        branch = options['branch']

        if len(version) != 7:
            raise CommandError(f'Commit hash {version} is not a valid 7 chars string')
        try:
            ['js', 'java', 'cpp', 'go', 'python'].index(lang)
        except ValueError:
            raise CommandError(f'Lang {lang} is not a valid lang code')

        try:
            """
            Using all arguments to determine if it's duplicated,
            which allows multiple projects with same name but different hash, lang or branch
            """
            Project.objects.get(
                p_name=name,
                github_url=url,
                git_commit_hash=version,
                lang=lang,
                git_branch=branch if branch is not None else 'main',
            )
            raise CommandError(f'Project with name {name} and other all arguments has already existed')
        except Project.DoesNotExist:
            newly = Project.objects.create(
                p_name=name,
                github_url=url,
                git_commit_hash=version,
                lang=lang,
                git_branch=branch if branch is not None else 'main',
            )

            self.stdout.write(self.style.SUCCESS(f'Successfully add project with pid {newly.pid}'))
