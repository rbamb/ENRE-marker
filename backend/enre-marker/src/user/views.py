import hashlib
import json
from exrex import getone

from django.http import JsonResponse
from datetime import datetime
from .models import User, Login


def hashing(content):
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


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
        user = User.objects.get(uid=userid)
        if user.pswd != hashing(userpw + user.salt):
            raise User.DoesNotExist
    except User.DoesNotExist:
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
    except Login.DoesNotExist:
        user_login = Login.objects.create(uid=user)
        user_login.token = get_token()
        user_login.save()
        return JsonResponse({
            'code': 200,
            'message': 'success',
            'token': user_login.token,
            'name': user.name
        })
