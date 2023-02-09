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
    file = urllib.parse.unquote(file)
    userid = token['id']
    meta = data.file.get_meta(userid, folder, file)
    if not meta:
        print('/docs/view meta for {} {} {} is not found'.format(userid, folder, file))
        raise SanicException('File Not Found', status_code=404)
    meta['signature'] = sign.generate_url_signature(userid)
    return response.json({
        'status': 'ok',
        'data': meta
    })


@bp.get('/<folder:strorempty>/<file>/page/<page:int>', name='view_page')
@protected
async def view_page(request, token, folder, file, page):
    folder = utils.fix_folder(folder)
    file = urllib.parse.unquote(file)
    userid = token['id']
    filename = data.file.get_user_file(userid, folder, file, 'page.{}.json'.format(page))
    if filename is None:
        print('/docs/view_page {} is not found'.format(filename))
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
    if userid is None:
        raise SanicException('File Not Found', status_code=404)
    filename = data.file.get_user_file(userid, folder, file, image_name)
    if filename is None:
        print('/docs/view_image {} is not found'.format(filename))
        raise SanicException('File Not Found', status_code=404)
    return await response.file(filename)
