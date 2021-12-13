import hashlib
import json
from exrex import getone

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from datetime import datetime
from .models import User, Login

from project.views import login_required


def hashing(content):
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def get_token():
    return getone('([a-z]|[A-Z]|[0-9]){64}')


@require_POST
def login(request):
    data = json.loads(request.body.decode())
    try:
        user_id = data.get('uid')
        user_pswd = data.get('pswd')
    except:
        return JsonResponse({
            'code': 4000,
            'message': 'Broken request data',
        })

    try:
        user = User.objects.get(uid=user_id)
        if user.pswd != hashing(user_pswd + user.salt):
            raise User.DoesNotExist
    except User.DoesNotExist:
        return JsonResponse({
            'code': 4000,
            'message': 'User ID or password does not match',
        })

    # if user re-login during a previous token is valid, then just override it with a new one
    try:
        previous = Login.objects.get(uid=user_id)
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


@login_required
@require_POST
def change_pswd(request, uid):
    data = json.loads(request.body.decode())
    try:
        old_pswd = data.get('oldPswd')
        new_pswd = data.get('newPswd')
    except:
        return JsonResponse({
            'code': 4000,
            'message': 'Broken request data',
        })

    try:
        user = User.objects.get(uid=uid)
        if user.pswd != hashing(old_pswd + user.salt):
            raise User.DoesNotExist
    except User.DoesNotExist:
        return JsonResponse({
            'code': 4000,
            'message': 'Password does not match',
        })

    user.pswd = hashing(new_pswd + user.salt)
    user.save()
    # Clean old token history, assuming that an old token should exist
    previous = Login.objects.get(uid=uid)
    previous.delete()
    return JsonResponse({
        'code': 200,
        'message': 'success',
    })
