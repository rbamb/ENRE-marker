from django.db import models


# Create your models here.
class Project(models.Model):
    pid = models.AutoField(primary_key=True)
    p_name = models.CharField(max_length=256, default='null')
    github_url = models.URLField(max_length=256)
    git_branch = models.CharField(max_length=16, default='main')
    git_commit_hash = models.CharField(max_length=7)
    lang = models.CharField(max_length=16)

    state = models.SmallIntegerField(default=0)

    def __str__(self):
        return self.p_name

    @staticmethod
    def get_all():
        res = Project.objects.all().order_by('pid')
        return res


class File(models.Model):
    fid = models.AutoField(primary_key=True)
    pid = models.ForeignKey(Project, on_delete=models.CASCADE)
    file_path = models.FilePathField(max_length=256)

    def __str__(self):
        return self.file_path

    @staticmethod
    def get_all():
        res = File.objects.all().order_by('fid')
        return res


class Entity(models.Model):
    class entity_type(models.IntegerChoices):
        # value = display name
        UNKNOWN = 0, 'unknown'
        VARIABLE = 1, 'variable'
        METHOD = 2, 'method'
        INTERFACE = 3, 'interface'
        ANNOTATION = 4, 'annotation'
        ENUM = 5, 'enum'
        CLASS = 6, 'class'
        FILE = 7, 'file'
        PACKAGE = 8, 'package'
        MODULE = 9, 'module'

    class reviewed(models.IntegerChoices):
        inapplicable = -2, 'inapplicable'
        notYet = -1, 'notYet'
        reviewPassed = 0, 'reviewPassed'
        remove = 1, 'remove'
        modify = 2, 'modify'

    eid = models.AutoField(primary_key=True)
    fid = models.ForeignKey(File, on_delete=models.CASCADE, default=0)
    code_name = models.CharField(max_length=256)
    loc_start_line = models.IntegerField(default=0)
    loc_start_column = models.IntegerField(default=0)
    loc_end_line = models.IntegerField(default=0)
    loc_end_column = models.IntegerField(default=0)

    entity_type = models.SmallIntegerField(choices=entity_type.choices)

    reviewed = models.SmallIntegerField(choices=reviewed.choices, default=-1)

    # whether this entity is modified
    shallow = models.BooleanField(default=False)
    # whether this entity is discovered by user
    inserted = models.BooleanField(default=False)

    def get_fid(self):
        return self.fid


class Relation(models.Model):
    class relation_type(models.IntegerChoices):
        UNKNOWN = 0, 'unknown'
        IMPORT = 1, 'import'
        INHERIT = 2, 'inherit'
        IMPLEMENT = 3, 'implement'
        CALL = 4, 'call'
        SET = 5, 'set'
        USE = 6, 'use'
        MODIFY = 7, 'modify'
        CAST = 8, 'cast'
        CREATE = 9, 'create'
        TYPED = 10, 'typed'

    class reviewed(models.IntegerChoices):
        inapplicable = -2, 'inapplicable'
        notYet = -1, 'notYet'
        reviewPassed = 0, 'reviewPassed'
        remove = 1, 'remove'
        modify = 2, 'modify'

    rid = models.AutoField(primary_key=True)
    from_entity = models.ForeignKey(Entity, on_delete=models.CASCADE)
    to_entity = models.IntegerField()
    relation_type = models.SmallIntegerField(choices=relation_type.choices)
    reviewed = models.SmallIntegerField(choices=reviewed.choices, default=-1)

    # whether this relation is modified
    shallow = models.BooleanField(default=False)
    # whether this relation is discovered by user
    inserted = models.BooleanField(default=False)
