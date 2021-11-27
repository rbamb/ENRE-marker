import json
import jwt
from django.conf import settings
from exrex import getone

# Create your views here.
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from datetime import datetime, timedelta
from .models import User, Login, Log
from project import models


def get_token():
    # 'exp': datetime.utcnow() + timedelta(days=1),
    return getone('([a-z]|[A-Z]|[0-9]){64}')


def register(request):
    data = json.loads(request.body.decode())
    try:
        userid = data.get('uid')
        userpw = data.get('pswd')
        userclaim = data.get('claim')
        name = data.get('name')
    except:
        res = {
            'code': 401,
            'message': 'data error'
        }
        return JsonResponse(res, safe=False)
    try:
        p = models.Project.objects.filter(pid=userclaim)
        user = User(uid=userid, pswd=userpw, claim=p.get(pid=userclaim), name=name)
        user.save()
        res = {
            'code': 200,
            'message': 'success'
        }
        return JsonResponse(res, safe=False)
    except:
        res = {
            'code': 500,
            'message': 'error'
        }
        return JsonResponse(res, safe=False)


def login(request):
    data = json.loads(request.body.decode())
    try:
        userid = data.get('uid')
        userpw = data.get('pswd')
    except:
        res = {
            'code': 401,
            'message': 'unauthorized',
        }
        return JsonResponse(res, safe=False)
    try:
        user = User.objects.get(uid=userid, pswd=userpw)
    except:
        res = {
            'code': 4000,
            'message': 'User ID or password does not match',
        }
        return JsonResponse(res, safe=False)

    # if user re-login during a previous token is valid, then just override it with a new one
    try:
        previous = Login.objects.get(uid=userid)
        previous.token = get_token()
        previous.gen_time = datetime.now()
        previous.save()
        return JsonResponse({
            'code': 200,
            'message': 'success',
            'token': previous.token,
            'name': user.name
        })
    except:
        user_login = Login.objects.create(uid=User.objects.get(uid=userid, pswd=userpw), gen_time=datetime.now())
        user_login.token = get_token()
        user_login.save()
        return JsonResponse({
            'code': 200,
            'message': 'success',
            'token': user_login.token,
            'name': user.name
        })
