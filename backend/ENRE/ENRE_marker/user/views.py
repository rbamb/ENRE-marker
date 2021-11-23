import json
import jwt
from django.conf import settings
from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from datetime import datetime, timedelta
from .models import User, Login, Log
from project import models


def get_token():
    # 'exp': datetime.utcnow() + timedelta(days=1),
    return jwt.encode({
        'exp': datetime.utcnow() + timedelta(days=1),
    }, settings.SECRET_KEY, algorithm='HS256')


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
            'message': 'not match',
        }
        return JsonResponse(res, safe=False)
    if Login.objects.filter(uid=User.objects.get(uid=userid, pswd=userpw)).exists():
        # print(jwt.decode(Login.objects.get(uid=userId).token, settings.SECRET_KEY, algorithms='HS256'))
        return HttpResponse("Already On!")
    else:
        user_login = Login.objects.create(uid=User.objects.get(uid=userid, pswd=userpw), gen_time=datetime.now())
        user_login.token = get_token()
        user_login.save()
        username = user.name
        res = {
            'code': 200,
            'message': 'success',
            'token': user_login.token,
            'name': username
        }
        return JsonResponse(res, safe=False)

