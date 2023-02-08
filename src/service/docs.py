import urllib.parse

from sanic import response, Blueprint
from sanic.exceptions import SanicException

import data.file

from .auth import protected
from . import sign, utils


bp = Blueprint('docs', url_prefix='/docs')


@bp.get('/<folder:strorempty>/<file>', name='view')
@protected
async def view(request, token, folder, file):
    folder = utils.fix_folder(folder)
    userid = token['id']
    summary = data.file.get_summary(userid, folder, file)
    return response.json({
        'status': 'ok',
        'data': summary
    })


@bp.get('/<folder:strorempty>/<file>/page/<page:int>', name='view_page')
@protected
async def view_page(request, token, folder, file, page):
    folder = utils.fix_folder(folder)
    userid = token['id']
    filename = data.file.get_user_file(userid, folder, file, 'page.{}.json'.format(page))
    if filename is None:
        raise SanicException('File Not Found', status_code=404)
    return await response.file(filename)


@bp.get('/<folder:strorempty>/<file>/<image_name>', name='view_image')
async def view_image(request, folder, file, image_name):
    if not image_name.endswith('.jpg'):
        raise SanicException('File Not Found', status_code=404)
    s = request.args.get('s')
    if not s:
        raise SanicException('File Not Found', status_code=404)
    folder = utils.fix_folder(folder)
    file = urllib.parse.unquote(file)
    userid = sign.userid_from_signature(s)
    filename = data.file.get_user_file(userid, folder, file, image_name)
    if filename is None:
        raise SanicException('File Not Found', status_code=404)
    return await response.file(filename)
