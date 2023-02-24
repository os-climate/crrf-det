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
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    filters = data.file.get_user_settings(userid, 'filters')
    return response.json({
        'status': 'ok',
        'data': filters
    })


@bp.post('/<filter_name>')
@protected
async def modify(request, token, filter_name):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    filters = data.file.get_user_settings(userid, 'filters')
    filter_ = request.json.get('filter')
    filter_name = urllib.parse.unquote(filter_name)
    if filter_ is None:
        # delete <filter_name>
        if filter_name in filters:
            del filters[filter_name]
    else:
        if 'new_name' in filter_:
            # rename <filter_name> to filter_['new_name']
            del filters[filter_name]
            filter_name = filter_['new_name']
            del filter_['new_name']
        # create new filter
        filters[filter_name] = filter_
    data.file.save_user_settings(userid, 'filters', filters)
    return response.json({
        'status': 'ok'
    })
