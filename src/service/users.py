import jwt
import asyncio

from datetime import datetime, timezone, timedelta
from sanic import response, Blueprint
from sanic.exceptions import SanicException

from data import user
from .auth import protected


bp = Blueprint('users', url_prefix='/users')


@bp.post('/login')
async def login(request):
    # curl -v -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' http://localhost:8000/users/login
    username = request.json.get('username')
    password = request.json.get('password')
    if (not username or
        not password):
        await asyncio.sleep(2)
        raise SanicException('Unauthorized.', status_code=401)
    (userid, level) = user.login(username, password)
    if (userid is None or
        level < 0):
        await asyncio.sleep(2)
        raise SanicException('Unauthorized.', status_code=401)
    message = user.User(userid, username, level).to_dict()
    message['exp'] = datetime.now(tz=timezone.utc) + timedelta(days=1)
    return response.json({
        'status':   'ok',
        'data': {
            'token':    jwt.encode(message, request.app.config.SECRET),
            'level':    level
        }
    })


@bp.post('/generate_invite')
@protected
async def generate_invite(request, token):
    userid = token['id']
    userlevel = token['level']
    # not enough permission to generate an invite
    if userlevel > 0:
        raise SanicException('Forbidden.', status_code=403)
    try:
        level = int(request.json.get('level'))
    except Exception as e:
        raise SanicException('Bad Request', status_code=400)
    if level < 0:
        raise SanicException('Bad Request', status_code=400)
    invite = user.generate_invite(level)
    return response.json({
        'status':   'ok',
        'data':     invite
    })


@bp.post('/new_from_invite')
async def new_from_invite(request):
    username = request.json.get('username')
    password = request.json.get('password')
    invite = request.json.get('invite')
    if (not username or
        not password or
        not invite):
        raise SanicException('Bad Request', status_code=400)
    r = user.add_from_invite(invite, username, password)
    if r:
        return response.json({
            'status':   'ok'
        })
    else:
        return response.json({
            'status':   'fail'
        })

