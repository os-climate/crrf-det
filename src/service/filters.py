import orjson
import urllib.parse

from sanic import response, Blueprint
from sanic.exceptions import SanicException

import data.file

from . import utils
from .auth import protected


bp = Blueprint('filters', url_prefix='/filters')


@bp.get('/')
@protected
async def index(request, token):
    userid = token['id']
    filters = data.file.get_user_settings(userid, 'filters')
    return response.json({
        'status': 'ok',
        'data': filters
    })


@bp.post('/<filter_name>')
@protected
async def change_or_remove(request, token, filter_name):
    userid = token['id']
    filters = data.file.get_user_settings(userid, 'filters')
    filter_ = request.json.get('filter')
    filter_name = urllib.parse.unquote(filter_name)
    if filter_ is None:
        if filter_name in filters:
            del filters[filter_name]
    else:
        filters[filter_name] = filter_
    data.file.save_user_settings(userid, 'filters', filters)
    return response.json({
        'status': 'ok'
    })
