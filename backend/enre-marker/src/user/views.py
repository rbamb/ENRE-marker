import json
from exrex import getone

from django.http import JsonResponse
from datetime import datetime
from .models import User, Login


def get_token():
    return getone('([a-z]|[A-Z]|[0-9]){64}')


def login(request):
    data = json.loads(request.body.decode())
    try:
        userid = data.get('uid')
        userpw = data.get('pswd')
    except:
        return JsonResponse({
            'code': 4000,
            'message': 'data format error',
        })

    try:
        user = User.objects.get(uid=userid, pswd=userpw)
    except KeyError:
        return JsonResponse({
            'code': 4000,
            'message': 'User ID or password does not match',
        })

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
    except KeyError:
        user_login = Login.objects.create(uid=User.objects.get(uid=userid, pswd=userpw))
        user_login.token = get_token()
        user_login.save()
        return JsonResponse({
            'code': 200,
            'message': 'success',
            'token': user_login.token,
            'name': user.name
        })
