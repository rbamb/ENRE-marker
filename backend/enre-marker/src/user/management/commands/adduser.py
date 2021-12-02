from django.core.management.base import BaseCommand, CommandError
from user.models import User
import hashlib
from exrex import getone


def hashing(content):
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


class Command(BaseCommand):
    help = 'Register a user'

    def add_arguments(self, parser):
        parser.add_argument('name', type=str)
        parser.add_argument('pswd', type=str)
        parser.add_argument('uid', type=int, nargs='?')

    def handle(self, *args, **options):
        name = options['name']
        pswd = options['pswd']
        uid = options['uid']
        try:
            User.objects.get(name=name)
            raise CommandError(f'User with name {name} has already existed')
        except User.DoesNotExist:
            salt = getone('([a-z]|[A-Z]|[0-9]){16}')

            newly = User.objects.create(
                uid=uid,
                name=name,
                pswd=hashing(hashing(pswd) + salt),
                salt=salt,
            )

            self.stdout.write(self.style.SUCCESS(f'Successfully add user with uid {newly.uid}'))
