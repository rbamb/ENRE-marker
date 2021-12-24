from django.db import models


class Project(models.Model):
    class ProjectState(models.IntegerChoices):
        ACTIVE = 0, 'active'
        LOCKED = 1, 'locked'
        REMOVED = 2, 'removed'

    pid = models.AutoField(primary_key=True)
    p_name = models.CharField(max_length=64)
    github_url = models.URLField(max_length=128)
    git_branch = models.CharField(max_length=16, default='main')
    git_commit_hash = models.CharField(max_length=7)
    lang = models.CharField(max_length=8)

    state = models.SmallIntegerField(default=ProjectState.ACTIVE)

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
    class ReviewedOption(models.IntegerChoices):
        inapplicable = -2, 'inapplicable'
        notYet = -1, 'notYet'
        reviewPassed = 0, 'reviewPassed'
        remove = 1, 'remove'
        modify = 2, 'modify'

    eid = models.AutoField(primary_key=True)
    fid = models.ForeignKey(File, on_delete=models.CASCADE)
    code_name = models.CharField(max_length=256)
    loc_start_line = models.IntegerField(default=-1)
    loc_start_column = models.IntegerField(default=-1)
    loc_end_line = models.IntegerField(default=-1)
    loc_end_column = models.IntegerField(default=-1)

    entity_type = models.SmallIntegerField()

    reviewed = models.SmallIntegerField(choices=ReviewedOption.choices, default=-1)

    # whether this entity is modified
    shallow = models.BooleanField(default=False)
    # whether this entity is discovered by user
    inserted = models.BooleanField(default=False)

    def get_fid(self):
        return self.fid


class Relation(models.Model):
    class ReviewedOption(models.IntegerChoices):
        inapplicable = -2, 'inapplicable'
        notYet = -1, 'notYet'
        reviewPassed = 0, 'reviewPassed'
        remove = 1, 'remove'
        modify = 2, 'modify'

    rid = models.AutoField(primary_key=True)
    from_entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='from_entity')
    to_entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='to_entity')
    loc_line = models.IntegerField(default=-1)
    loc_column = models.IntegerField(default=-1)

    relation_type = models.SmallIntegerField()

    reviewed = models.SmallIntegerField(choices=ReviewedOption.choices, default=-1)

    # whether this relation is modified
    shallow = models.BooleanField(default=False)
    # whether this relation is discovered by user
    inserted = models.BooleanField(default=False)
