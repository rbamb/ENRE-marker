import copy
import json
from datetime import timedelta, datetime, timezone

from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.db import connection
from django.db.models import Count

from user.models import User, Login, Log
from . import formats
from .formats import ManuallyEntity, EntityStatus, ManuallyRelation, RelationStatus
from .models import Project, File, Entity, Relation


def login_required(func):
    def inner(request, *args, **kwargs):
        try:
            token = request.META['HTTP_TOKEN']
        except KeyError:
            return JsonResponse({
                'code': 401,
                'message': 'no token',
            })

        try:
            record = Login.objects.get(token=token)
        except Login.DoesNotExist:
            return JsonResponse({
                'code': 401,
                'message': 'login required',
            })

        if datetime.now(tz=timezone.utc) > (record.gen_time + timedelta(days=1)):
            return JsonResponse({
                'code': 401,
                'message': 'login expired',
            })

        return func(request, uid=record.uid.uid, *args, **kwargs)

    return inner


@require_GET
@login_required
def get_all_projects(request, uid):
    project_list = Project.objects.all()
    claimed = User.objects.get(uid=uid).claim_id
    p_list = []
    for project in project_list:
        progress_done = 0
        progress_total = 0

        with connection.cursor() as cursor:
            cursor.execute(
                '''select reviewed, count(*) as count
from project_entity
where
      fid_id in
      (
          select fid
          from project_file
          where pid_id = %s
          )
and shallow = false
group by reviewed''', [project.pid])
            entity_progress = cursor.fetchall()
            for item in entity_progress:
                progress_total += item[1]
                if item[0] >= 0:
                    progress_done += item[1]

            cursor.execute(
                '''select reviewed, count(*) as count
from project_relation
where
      from_entity_id in (
          select eid
          from project_entity
          where fid_id in (
              select fid
              from project_file
              where pid_id = %s
              )
        )
and shallow = false
group by reviewed''', [project.pid])
            relation_progress = cursor.fetchall()
            for item in relation_progress:
                progress_total += item[1]
                if item[0] >= 0:
                    progress_done += item[1]

        progress = 100 if progress_total == 0 else progress_done / progress_total * 100
        p = formats.Project(
            project.pid,
            project.p_name,
            project.github_url,
            project.git_commit_hash,
            project.lang,
            progress,
            project.pid == claimed,
            project.state,
        )
        p_list.append(copy.deepcopy(p.to_dict()))

    res = {
        'code': 200,
        'message': 'success',
        'project': p_list
    }
    return JsonResponse(res, safe=False)


@require_GET
@login_required
def view_a_project(request, uid, pid):
    try:
        file_list = File.objects.filter(pid=pid)
        f_list = []

        for f in file_list:
            entity_progress_done = 0
            entity_progress_total = 0
            relation_progress_done = 0
            relation_progress_total = 0

            with connection.cursor() as cursor:
                cursor.execute(
                    '''select reviewed, count(*) as count
                    from project_entity
                    where fid_id = %s and shallow = false
                    group by reviewed
                    ''', [f.fid])
                for item in cursor.fetchall():
                    entity_progress_total += item[1]
                    if item[0] >= 0:
                        entity_progress_done += item[1]

                cursor.execute(
                    '''select reviewed, count(*) as count
                    from project_relation
                    where from_entity_id in
                        (
                            select eid
                            from project_entity
                            where fid_id = %s
                        ) and shallow = false
                    group by reviewed
                    ''', [f.fid])
                for item in cursor.fetchall():
                    relation_progress_total += item[1]
                    if item[0] >= 0:
                        relation_progress_done += item[1]

            entity_progress = 100 if entity_progress_total == 0 else entity_progress_done / entity_progress_total * 100
            relation_progress = 100 if relation_progress_total == 0 else relation_progress_done / relation_progress_total * 100

            file = formats.File(
                f.fid,
                f.file_path,
                entity_progress_total,
                entity_progress,
                relation_progress_total,
                relation_progress,
            )
            f_list.append(copy.deepcopy(file.to_dict()))

        res = {
            'code': 200,
            'message': 'success',
            'file': f_list,
        }
        return JsonResponse(res, safe=False)
    except Project.DoesNotExist:
        res = {
            'code': 4001,
            'message': 'no such pid'
        }
        return JsonResponse(res)


@require_POST
@login_required
def claim_a_project(request, uid, pid):
    try:
        project = Project.objects.get(pid=pid)
        user = User.objects.get(uid=uid)
        user.claim = project
        user.save()
        co_users = User.objects.filter(claim=pid)
        collaborators = []
        for user in co_users:
            if user.uid != uid:
                u = formats.User(user.uid, user.name)
                collaborators.append(copy.deepcopy(u.to_dict()))
        res = {
            'code': 200,
            'message': 'success',
            'collaborator': collaborators
        }
        return JsonResponse(res, safe=False)
    except Project.DoesNotExist:
        res = {
            'code': 4001,
            'message': 'no such pid'
        }
        return JsonResponse(res, safe=False)


def valid_id(func):
    def inner(request, *args, **kwargs):
        try:
            Project.objects.get(pid=kwargs['pid'])
        except Project.DoesNotExist:
            return JsonResponse({
                'code': 4001,
                'message': 'no such pid'
            })

        try:
            File.objects.get(fid=kwargs['fid'])
        except File.DoesNotExist:
            return JsonResponse({
                'code': 4002,
                'message': 'no such fid'
            })

        return func(request, *args, **kwargs)

    return inner


@login_required
@valid_id
def entity_operation(request, uid, pid, fid):
    f = File.objects.get(fid=fid)
    current_user = User.objects.get(uid=uid)

    if request.method == 'POST':
        if current_user.claim.pid != pid:
            return JsonResponse({
                'code': 4000,
                'message': 'Can not contribute to a non-claimed project'
            })

        data = json.loads(request.body.decode()).get('data')
        for entity_user_result in data:
            to_id = None
            if entity_user_result.get('isManually'):
                # insert
                operation = 3
                manually_entity = entity_user_result.get('entity')
                obj = Entity.objects.create(
                    code_name=manually_entity.get('name'),
                    entity_type=manually_entity.get('eType'),
                    loc_start_line=manually_entity.loc.get('start').get('line'),
                    loc_start_column=manually_entity.loc.get('start').get('column'),
                    loc_end_line=manually_entity.loc.get('end').get('line'),
                    loc_end_column=manually_entity.loc.get('end').get('column'),
                    fid=f,
                    inserted=True,
                    reviewed=-2,
                )
                eid = obj.eid
            else:
                eid = entity_user_result.get('eid')
                if entity_user_result.get('isCorrect'):
                    # reviewPassed
                    operation = 0
                    Entity.objects.filter(eid=eid).update(reviewed=0)
                else:
                    operation = entity_user_result.get('fix').get('shouldBe')
                    if operation == 2:
                        # modify
                        manually_entity = entity_user_result.get('fix').get('newly')
                        obj = Entity.objects.create(
                            code_name=manually_entity.get('name'),
                            entity_type=manually_entity.get('eType'),
                            loc_start_line=manually_entity.get('loc').get('start').get(
                                'line'),
                            loc_start_column=manually_entity.get('loc').get(
                                'start').get('column'),
                            loc_end_line=manually_entity.get('loc').get('end').get(
                                'line'),
                            loc_end_column=manually_entity.get('loc').get('end').get(
                                'column'),
                            fid=f,
                            shallow=True,
                            reviewed=-2
                        )
                        to_id = obj.eid
                        Entity.objects.filter(eid=eid).update(reviewed=2)
                    else:
                        # remove
                        Entity.objects.filter(eid=eid).update(reviewed=1)

            Log.objects.create(
                uid=current_user,
                op_to=0,
                operation=operation,
                element_id=eid,
                to_id=to_id
            )

        res = {
            'code': 200,
            'message': 'success'
        }
        return JsonResponse(res, safe=False)

    # get all entities in fid in pid
    elif request.method == 'GET':
        e_list = []
        for entity in Entity.objects.filter(fid=f, shallow=False):
            e_list.append(build_entity(entity).to_dict())

        res = {
            'code': 200,
            'message': 'success',
            'entity': e_list,
            'total': len(e_list)
        }
        return JsonResponse(res, safe=False)


def build_entity(entity):
    if entity.reviewed > -1:
        operation = entity.reviewed
        if operation == 2:
            to_id = Log.objects.filter(op_to=0, element_id=entity.eid).latest('time').to_id
            to_entity = Entity.objects.get(eid=to_id)
            m_entity = ManuallyEntity(
                to_entity.code_name,
                to_entity.loc_start_line,
                to_entity.loc_start_column,
                to_entity.loc_end_line,
                to_entity.loc_end_column,
                to_entity.entity_type
            )
            status = EntityStatus(True, operation, m_entity)
        else:
            status = EntityStatus(True, operation)
    elif entity.reviewed == -1:
        status = EntityStatus(False)
    # That is entity.reviewed == -2 (inapplicable), which means inserted
    else:
        status = EntityStatus(True, 3)

    return formats.Entity(
        entity.eid,
        entity.code_name,
        entity.loc_start_line,
        entity.loc_start_column,
        entity.loc_end_line,
        entity.loc_end_column,
        entity.entity_type,
        status
    )


@login_required
@valid_id
def relation_operation(request, uid, pid, fid):
    f = File.objects.get(fid=fid)
    current_user = User.objects.get(uid=uid)

    # post user label relation
    if request.method == 'POST':
        if current_user.claim.pid != pid:
            return JsonResponse({
                'code': 4000,
                'message': 'Can not contribute to a non-claimed project'
            })
        # data
        data = json.loads(request.body.decode()).get('data')
        for relation_user_result in data:
            to_id = None
            if relation_user_result.get('isManually'):
                return JsonResponse({
                    'code': 4000,
                    'message': 'Insert is currently disabled'
                })
                # insert
                # operation = 3
                # manually_relation = relation_user_result.get('relation')
                # from_entity = Entity.objects.get(eid=manually_relation.get('eFrom'))
                # to_entity = Entity.objects.get(eid=manually_relation.get('eTo'))
                # m_relation = Relation.objects.create(
                #     from_entity=from_entity,
                #     to_entity=to_entity,
                #     relation_type=manually_relation.get('rType'),
                #     inserted=True,
                #     reviewed=-2,
                # )
                # rid = m_relation.rid
            else:
                rid = relation_user_result.get('rid')
                relation = Relation.objects.get(rid=rid)
                if relation_user_result.get('isCorrect'):
                    # reviewPassed
                    operation = 0
                    Relation.objects.filter(rid=rid).update(reviewed=0)
                else:
                    operation = relation_user_result.get('fix').get('shouldBe')
                    if operation == 2:
                        # modify
                        manually_relation = relation_user_result.get('fix').get('newly')
                        m_relation = Relation.objects.create(
                            from_entity=relation.from_entity,
                            to_entity=relation.to_entity,
                            relation_type=manually_relation.get('rType'),
                            shallow=True,
                            reviewed=-2,
                        )
                        to_id = m_relation.rid
                        Relation.objects.filter(rid=rid).update(reviewed=2)
                    else:
                        # remove
                        Relation.objects.filter(rid=rid).update(reviewed=1)
            Log.objects.create(
                uid=current_user,
                op_to=1,
                operation=operation,
                element_id=rid,
                to_id=to_id,
            )
        res = {
            'code': 200,
            # 'message': 'success',
        }
        return JsonResponse(res, safe=False)

    # get all relations in fid in pid
    elif request.method == 'GET':
        r_list = []
        for relation in Relation.objects.filter(from_entity__fid=f, shallow=False):
            if relation.reviewed > -1:
                operation = relation.reviewed
                if operation == 2:
                    to_id = Log.objects.filter(op_to=1, element_id=relation.rid).latest('time').to_id
                    to_relation = Relation.objects.get(rid=to_id)
                    m_relation = ManuallyRelation(
                        to_relation.relation_type
                    )
                    status = RelationStatus(True, operation, m_relation)
                else:
                    status = RelationStatus(True, operation)
            elif relation.reviewed == -1:
                status = RelationStatus(False)
            else:
                status = RelationStatus(True, 3)

            to_fid = Entity.objects.get(eid=relation.to_entity.eid).get_fid().fid
            r = formats.Relation(
                relation.rid,
                build_entity(relation.from_entity),
                build_entity(relation.to_entity),
                to_fid,
                relation.relation_type,
                status
            )
            r_list.append(r.to_dict())

        res = {
            'code': 200,
            'message': 'success',
            'relation': r_list,
            'total': len(r_list),
        }
        return JsonResponse(res, safe=False)
