import jwt
from datetime import datetime, timezone, timedelta
from sanic import response, Blueprint
from sanic.exceptions import SanicException

from data import user


bp = Blueprint('users', url_prefix='/users')


@bp.post('/login')
async def login(request):
    username = request.json.get('username')
    password = request.json.get('password')
    if (not username or
        not password):
        raise SanicException('Unauthorized.', status_code=401)
    (userid, level) = user.login(username, password)
    if (userid is None or
        level < 0):
        raise SanicException('Unauthorized.', status_code=401)
    message = user.User(userid, username, level).to_dict()
    message['exp'] = datetime.now(tz=timezone.utc) + timedelta(days=1)
    return response.text(
        jwt.encode(message, request.app.config.SECRET)
    )
