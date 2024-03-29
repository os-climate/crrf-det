from sanic import response, Blueprint
from sanic.exceptions import SanicException

import data.file
import task.file
from . import utils
from .auth import protected
from .sign import generate_url_signature


bp = Blueprint('files', url_prefix='/files')


@bp.get('/', name='index')
@bp.get('/<folder>', name='index_folder')
@protected
async def index(request, token, folder=None):
    # curl -v -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRjYmJmNWMzMTYwMjI0YzZmMjEyIiwidXNlcm5hbWUiOiJhZG1pbiIsImxldmVsIjowLCJleHAiOjE2NzU0Nzk2NTl9.Azef1fMmbAkchum7rVePi5458eN6Z6Oo_SSQkVYlLq0" http://localhost:8000/files
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    folder = utils.fix_folder(folder)
    userid = token['id']
    ret = data.file.listdir(userid, folder)
    return response.json({
        'status': 'ok',
        'data': {
            'items': ret,
            'signature': generate_url_signature(userid)
        }
    })


@bp.post('/new', name='new')
@bp.post('/new/<folder>', name='new_folder')
@protected
async def new(request, token, folder=None):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    folder = utils.fix_folder(folder)
    userid = token['id']
    ret = False
    if (request.files and
        len(request.files) > 0):
        # a file upload
        for k, v in request.files.items():
            ret = data.file.write(userid, folder, v[0].name, v[0].body)
            if ret is not None:
                r = task.file.initialize_pdf.schedule((userid, folder, ret), delay=0)
                # data.file.set_working_task(userid, folder, ret, 'initialize_pdf', r.id)
    elif request.json:
        # create a dir
        name = request.json['name']
        ret = data.file.mkdir(userid, folder, name)
    else:
        raise SanicException('Bad Request', status_code=400)
    if ret:
        return response.json({
            'status': 'ok'
        })
    else:
        return response.json({
            'status': 'fail'
        })


@bp.post('/change', name='change')
@bp.post('/change/<folder>', name='change_folder')
@protected
async def change(request, token, folder=None):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    folder = utils.fix_folder(folder)
    userid = token['id']
    old_name = request.json.get('old_name', '')
    new_name = request.json.get('new_name', '')
    if (not old_name or
        not new_name):
        return response.json({
            'status': 'fail'
        })
    ret = data.file.mv(userid, folder, old_name, new_name)
    if ret:
        return response.json({
            'status': 'ok'
        })
    else:
        return response.json({
            'status': 'fail'
        })


@bp.post('/delete', name='delete')
@bp.post('/delete/<folder>', name='delete_folder')
@protected
async def delete(request, token, folder=None):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    folder = utils.fix_folder(folder)
    userid = token['id']
    names = request.json.get('name', [])
    for name in names:
        if not data.file.rm(userid, folder, name):
            return response.json({
                'status': 'fail'
            })
    return response.json({
        'status': 'ok'
    })

