import jwt
import asyncio

from datetime import datetime, timezone, timedelta
from sanic import response, Blueprint
from sanic.exceptions import SanicException

from data import user


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
        'data':     jwt.encode(message, request.app.config.SECRET)
    })
