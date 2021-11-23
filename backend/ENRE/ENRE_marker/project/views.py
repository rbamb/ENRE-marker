import json
from datetime import timedelta, datetime, date, time, timezone

import jwt
import copy
from django.conf import settings
from django.core import serializers
from django.http import HttpResponse, JsonResponse

from . import formats
from .models import Project, File, Entity, Relation
from .tools import json_to_python, create_project, extract_file_data, process_und
from user import models

# Create your views here.
from .formats import Manually_entity, Entity_status, Manually_relation, Relation_status


def check_user_login(gen_time):
    # user_expire_time = jwt.decode(token, settings.SECRET_KEY, algorithms='HS256').get('exp')
    # print(datetime.now(tz=timezone.utc) + timedelta(hours=8))
    # print(gen_time + timedelta(days=1))
    if datetime.now(tz=timezone.utc) > (gen_time + timedelta(days=1)):
        # res = {
        #     'code': 500,
        #     'message': 'expired user'
        # }
        # return JsonResponse(res, safe=False)
        return False
    else:
        return True


def load_file(requset):
    project_name = 'pig-0.17.0-src'
    relation_data = json_to_python('D:\pl_output\pig_refs.json')
    entity_data = json_to_python('D:\pl_output\pig_entities.json')
    github_url = 'apache/pig'
    lang = 'java'
    # create project
    p = create_project(github_url, project_name, lang)
    p.git_commit_hash = '59ec4a3'
    p.save()
    # add file
    extract_file_data(p, relation_data)
    # add entity and relation
    process_und(relation_data, entity_data, p, project_name)
    return HttpResponse(project_name + ' upload successfully!')


def show_files(request):
    file_list = File.objects.all()
    output = ', '.join([q.file_path for q in file_list])
    return HttpResponse(output)


def calculate_p_entity(pid):
    p_entity = Entity.objects.select_related("fid__pid")
    count = 0
    reviewed = 0
    for e in p_entity:
        if e.fid.pid.pid == pid:
            count = count + 1
            if e.reviewed > -1:
                reviewed = reviewed + 1
    return count, reviewed


def calculate_p_relation(pid):
    p_relation = Relation.objects.select_related("from_entity__fid__pid")
    count = 0
    reviewed = 0
    for r in p_relation:
        if r.from_entity.fid.pid.pid == pid:
            count = count + 1
            if r.reviewed > -1:
                reviewed = reviewed + 1
    return count, reviewed


def calculate_entity(fid):
    f_entity = Entity.objects.select_related("fid")
    count = 0
    reviewed = 0
    for e in f_entity:
        if e.fid.fid == fid:
            count = count + 1
            if e.reviewed > -1:
                reviewed = reviewed + 1
    return count, reviewed


def calculate_relation(fid):
    f_relation = Relation.objects.select_related("from_entity__fid")
    count = 0
    reviewed = 0
    for r in f_relation:
        if r.from_entity.fid.fid == fid:
            count = count + 1
            if r.reviewed > -1:
                reviewed = reviewed + 1
    return count, reviewed


def get_all_projects(request):
    project_list = Project.objects.all()
    p_list = []
    for project in project_list:
        e_count, e_progress = calculate_p_entity(project.pid)
        r_count, r_progress = calculate_relation(project.pid)
        progress = (e_progress + r_progress) / (e_count + r_count) * 100
        p = formats.Project(project.pid, project.p_name, project.github_url, "", project.lang, progress, True, 0)
        p_list.append(copy.deepcopy(p.to_dict()))
    # data = serializers.serialize("json", project_list)
    res = {
        'code': 200,
        'message': 'success',
        'project': p_list
    }
    return JsonResponse(res, safe=False)


def get_hash(data):
    return jwt.encode(data, settings.SECRET_KEY, algorithm='HS256')


def view_a_project(request, pid):
    try:
        if request.method == "GET":
            # p = Project.objects.get(pid=pid)
            file_list = File.objects.filter(pid=pid)
            f_list = []
            for f in file_list:
                e_count, e_progress = calculate_entity(f.fid)
                r_count, r_progress = calculate_relation(f.fid)
                file = formats.File(f.fid, f.file_path, e_count, e_progress, r_count, r_progress)
                f_list.append(copy.deepcopy(file.to_dict()))
            # data = serializers.serialize("json", file_list)
            res = {
                'code': 200,
                'message': 'succeeded',
                'file': f_list
            }
            return JsonResponse(res, safe=False)
        else:
            res = {
                'code': 500,
                'message': 'should be GET'
            }
            return JsonResponse(res, safe=False)
    except:
        res = {
            'code': 4001,
            'message': 'no such pid'
        }
        return JsonResponse(res, safe=False)


def claim_a_project(request, pid):
    try:
        # get user's token from Header
        token = request.META.get("HTTP_TOKEN")
        current_user = models.Login.objects.get(token=token)
        if check_user_login(current_user.gen_time):
            # user on
            if current_user.uid.claim.pid != pid:
                current_user.claim = pid
                current_user.save()
            # get project objects by pid
            if request.method == 'POST':
                try:
                    # p = Project.objects.get(pid=pid)
                    # file_list = File.objects.filter(pid=pid)
                    # data = serializers.serialize("json", file_list)
                    user_list = models.User.objects.filter(claim=pid)
                    u_list = []
                    for user in user_list:
                        u = formats.User(user.uid, user.name)
                        u_list.append(copy.deepcopy(u.to_dict()))
                    res = {
                        'code': 200,
                        'message': 'succeeded',
                        'collaborator': u_list
                        # 'hash': get_hash(json.loads(data))
                    }
                    return JsonResponse(res, safe=False)
                except:
                    res = {
                        'code': 4001,
                        'message': 'no such pid'
                    }
                    return JsonResponse(res, safe=False)
            else:
                res = {
                    'code': 500,
                    'message': 'should be POST'
                }
                return JsonResponse(res, safe=False)
        else:
            current_user.delete()
            res = {
                'code': 500,
                'message': 'expired user'
            }
            return JsonResponse(res, safe=False)
    except:
        res = {
            'code': 500,
            'message': 'error'
        }
        return JsonResponse(res, safe=False)


def entity_operation(request, pid, fid):
    token = request.META.get("HTTP_TOKEN")
    current_user = models.Login.objects.get(token=token)
    if check_user_login(current_user.gen_time):
        # user on
        pass
    else:
        current_user.delete()
        res = {
            'code': 401,
            'message': 'unauthorized'
        }
        return JsonResponse(res, safe=False)
    try:
        p = Project.objects.get(pid=pid)
    except:
        res = {
            'code': 4001,
            'message': 'no such pid'
        }
        return JsonResponse(res, safe=False)
    try:
        f = File.objects.get(fid=fid)
    except:
        res = {
            'code': 4002,
            'message': 'no such fid'
        }
        return JsonResponse(res, safe=False)
    try:
        if request.method == 'POST':
            if current_user.uid.claim.pid != pid:
                res = {
                    'code': 403,
                    'message': 'not your business'
                }
                return JsonResponse(res, safe=False)
            # data
            data = json.loads(request.body.decode()).get('data')
            for entity_user_result in data:
                to_id = 0
                if entity_user_result.get('isManually'):
                    # insert
                    operation = 3
                    manually_entity = entity_user_result.get('entity')
                    m_entity = Entity.objects.create(code_name=manually_entity.get('name'),
                                                     entity_type=manually_entity.get('eType'),
                                                     loc_start_line=manually_entity.loc.get('start').get('line'),
                                                     loc_start_column=manually_entity.loc.get('start').get('column'),
                                                     loc_end_line=manually_entity.loc.get('end').get('line'),
                                                     loc_end_column=manually_entity.loc.get('end').get('column'),
                                                     fid=f, inserted=True)
                    eid = m_entity.eid
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
                            m_entity = Entity.objects.create(code_name=manually_entity.get('name'),
                                                             entity_type=manually_entity.get('eType'),
                                                             loc_start_line=manually_entity.get('loc').get('start').get(
                                                                 'line'),
                                                             loc_start_column=manually_entity.get('loc').get(
                                                                 'start').get('column'),
                                                             loc_end_line=manually_entity.get('loc').get('end').get(
                                                                 'line'),
                                                             loc_end_column=manually_entity.get('loc').get('end').get(
                                                                 'column'),
                                                             fid=f, inserted=True, reviewed=2)
                            to_id = m_entity.eid
                            Entity.objects.filter(eid=eid).update(reviewed=2, shallow=True)
                        else:
                            # remove
                            Entity.objects.filter(eid=eid).update(reviewed=1)
                models.Log.objects.create(uid=current_user.uid, op_to=0, operation=operation, element_id=eid,
                                          to_id=to_id)
            res = {
                'code': 200,
                'message': 'success'
            }
            return JsonResponse(res, safe=False)

        # get all entities in fid in pid
        elif request.method == 'GET':
            entity_list = Entity.objects.filter(fid=f)
            e_list = []
            for entity in entity_list:
                if entity.reviewed > -1:
                    operation = entity.reviewed
                    if operation == 2:
                        to_id = models.Log.objects.get(uid=current_user, element_id=entity.eid).to_id
                        to_entity = Entity.objects.get(eid=to_id)
                        m_entity = Manually_entity(to_entity.code_name, to_entity.loc_start_line,
                                                   to_entity.loc_start_column, to_entity.loc_end_line,
                                                   to_entity.loc_end_column, to_entity.entity_type)
                        status = Entity_status(True, operation, m_entity)
                    else:
                        status = Entity_status(True, operation, Manually_entity("", 0, 0, 0, 0, 0))
                else:
                    status = Entity_status(False, entity.reviewed, Manually_entity("", 0, 0, 0, 0, 0))
                e = formats.Entity(entity.eid, entity.code_name, entity.loc_start_line, entity.loc_start_column,
                                   entity.loc_end_line, entity.loc_end_column, entity.entity_type, status)
                e_list.append(copy.deepcopy(e.to_dict()))
            # results = [e_.to_dict() for e_ in e_list]
            # data = serializers.serialize("json", e_list)
            res = {
                'code': 200,
                'message': 'succeeded',
                'entity': e_list
            }
            return JsonResponse(res, safe=False)
    except:
        res = {
            'code': 500,
            'message': 'error'
        }
        return JsonResponse(res, safe=False)


def relation_operation(request, pid, fid):
    token = request.META.get("HTTP_TOKEN")
    current_user = models.Login.objects.get(token=token)
    if check_user_login(current_user.gen_time):
        # user on
        pass
    else:
        current_user.delete()
        res = {
            'code': 401,
            'message': 'unauthorized'
        }
        return JsonResponse(res, safe=False)
    try:
        p = Project.objects.get(pid=pid)
    except:
        res = {
            'code': 4001,
            'message': 'no such pid'
        }
        return JsonResponse(res, safe=False)
    try:
        f = File.objects.get(fid=fid)
    except:
        res = {
            'code': 4002,
            'message': 'no such fid'
        }
        return JsonResponse(res, safe=False)
    try:
        # post user label relation
        if request.method == 'POST':
            if current_user.uid.claim.pid != pid:
                res = {
                    'code': 403,
                    'message': 'not your business'
                }
                return JsonResponse(res, safe=False)
            # data
            data = json.loads(request.body.decode()).get('data')
            for relation_user_result in data:
                to_id = 0
                if relation_user_result.get('isManually'):
                    # insert
                    operation = 3
                    manually_relation = relation_user_result.get('relation')
                    from_entity = Entity.objects.get(eid=manually_relation.get('eFrom'))
                    m_relation = Relation.objects.create(from_entity=from_entity, to_entity=manually_relation.get('eTo')
                                                         , relation_typr=manually_relation.get('rType'), inserted=True)
                    rid = m_relation.rid
                else:
                    rid = relation_user_result.get('rid')
                    if relation_user_result.get('isCorrect'):
                        # reviewPassed
                        operation = 0
                        Relation.objects.filter(rid=rid).update(reviewed=0)
                    else:
                        operation = relation_user_result.get('fix').get('shouldBe')
                        if operation == 2:
                            # modify
                            manually_relation = relation_user_result.get('fix').get('newly')
                            from_entity = Entity.objects.get(eid=manually_relation.get('eFrom'))
                            m_relation = Relation.objects.create(from_entity=from_entity,
                                                                 to_entity=manually_relation.get('eTo'),
                                                                 relation_type=manually_relation.get('rType'),
                                                                 inserted=True, reviewed=2)
                            to_id = m_relation.rid
                            Relation.objects.filter(rid=rid).update(reviewed=2, shallow=True)
                        else:
                            # remove
                            Relation.objects.filter(rid=rid).update(reviewed=1)
                models.Log.objects.create(uid=current_user.uid, op_to=1, operation=operation, element_id=rid,
                                          to_id=to_id)
            res = {
                'code': 200,
                'message': 'success'
            }
            return JsonResponse(res, safe=False)

        # get all relations in fid in pid
        elif request.method == 'GET':
            r_list = []
            for relation in Relation.objects.all():
                if relation.from_entity.fid == f:
                    # relation from certain file
                    if relation.reviewed > -1:
                        operation = relation.reviewed
                        if operation == 2:
                            to_id = models.Log.objects.get(uid=current_user, element_id=relation.rid).to_id
                            to_relation = Relation.objects.get(rid=to_id)
                            m_relation = Manually_relation(to_relation.from_entity, to_relation.to_entity,
                                                           to_relation.relation_type)
                            status = Relation_status(True, operation, m_relation)
                        else:
                            status = Relation_status(True, operation, Manually_relation(0, 0, ""))
                    else:
                        status = Relation_status(False, relation.reviewed, Manually_relation(0, 0, ""))
                    to_fid = Entity.objects.get(eid=relation.to_entity).get_fid().fid
                    r = formats.Relation(relation.rid, relation.from_entity.eid, relation.to_entity, to_fid,
                                         relation.relation_type, status)
                    r_list.append(copy.deepcopy(r.to_dict()))
            res = {
                'code': 200,
                'message': 'succeeded',
                'relation': r_list
            }
            return JsonResponse(res, safe=False)
    except:
        res = {
            'code': 500,
            'message': 'error'
        }
        return JsonResponse(res, safe=False)
