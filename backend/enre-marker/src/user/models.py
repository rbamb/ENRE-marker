from django.db import models
from datetime import datetime


class User(models.Model):
    uid = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32, default="")
    pswd = models.CharField(max_length=64)
    claim = models.ForeignKey(
        'project.Project',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )


class Login(models.Model):
    uid = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    token = models.CharField(max_length=64)
    gen_time = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return self.token


class Log(models.Model):
    class OpTo(models.IntegerChoices):
        ENTITY = 0, 'entity'
        RELATION = 1, 'relation'

    class Operation(models.IntegerChoices):
        REVIEWPASSED = 0, 'review passed'
        REMOVE = 1, 'remove'
        MODIFY = 2, 'modify'
        INSERT = 3, 'insert'

    lid = models.AutoField(primary_key=True)
    uid = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    time = models.DateTimeField(default=datetime.now)
    op_to = models.SmallIntegerField(choices=OpTo.choices)
    operation = models.SmallIntegerField(choices=Operation.choices)
    element_id = models.IntegerField()
    to_id = models.IntegerField(null=True)
