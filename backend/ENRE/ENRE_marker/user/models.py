from django.db import models
import jwt

from datetime import datetime, timedelta


# Create your models here.
class User(models.Model):
    uid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32, default="")
    pswd = models.CharField(max_length=256)
    claim = models.ForeignKey('project.Project', on_delete=models.CASCADE)


class Login(models.Model):
    uid = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    token = models.CharField(max_length=256)
    gen_time = models.DateTimeField()

    def __str__(self):
        return self.token


class Log(models.Model):
    class op_to(models.IntegerChoices):
        ENTITY = 0, 'entity'
        RELATION = 1, 'relation'

    class operation(models.IntegerChoices):
        REVIEWPASSED = 0, 'review passed'
        REMOVE = 1, 'remove'
        MODIFY = 2, 'modify'
        INSERT = 3, 'insert'

    lid = models.AutoField(primary_key=True)
    uid = models.ForeignKey(User, on_delete=models.CASCADE)
    time = models.TimeField(default=datetime.utcnow)
    op_to = models.SmallIntegerField(choices=op_to.choices)
    operation = models.SmallIntegerField(choices=operation.choices)
    element_id = models.IntegerField()
    to_id = models.IntegerField()
