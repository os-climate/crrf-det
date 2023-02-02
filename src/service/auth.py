# from https://sanic.dev/en/guide/how-to/authentication.html#auth.py

from functools import wraps

import jwt
from sanic import text


def check_token(request):
    if not request.token:
        return False
    try:
        ret = jwt.decode(
            request.token, request.app.config.SECRET, algorithms=["HS256"]
        )
    except jwt.exceptions.InvalidTokenError:
        return False
    else:
        return ret


def protected(wrapped):
    def decorator(f):
        @wraps(f)
        async def decorated_function(request, *args, **kwargs):
            token = check_token(request)
            if token:
                response = await f(request, token, *args, **kwargs)
                return response
            else:
                return text("Unauthorized.", 401)
        return decorated_function
    return decorator(wrapped)
