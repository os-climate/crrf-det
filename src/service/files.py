from sanic import response, Blueprint
from sanic.exceptions import SanicException

import data.file
from .auth import protected


bp = Blueprint('files', url_prefix='/files')


@bp.get('/', name='index')
@bp.get('/<folder>', name='index_folder')
@protected
async def index(request, token, folder=None):
    # curl -v -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRjYmJmNWMzMTYwMjI0YzZmMjEyIiwidXNlcm5hbWUiOiJhZG1pbiIsImxldmVsIjowLCJleHAiOjE2NzU0Nzk2NTl9.Azef1fMmbAkchum7rVePi5458eN6Z6Oo_SSQkVYlLq0" http://localhost:8000/files
    userid = token['id']
    ret = data.file.listdir(userid, folder)
    print('files.index', token, ret)
    return response.json({
        'status': 'ok',
        'data': ret
    })


@bp.post('/new', name='new')
@bp.post('/new/<folder>', name='new_folder')
@protected
async def new(request, token, folder=None):
    userid = token['id']
    ret = False
    if (request.files and
        len(request.files) > 0):
        # a file upload
        for k, v in request.files.items():
            ret = data.file.write(userid, folder, v[0].name, v[0].body)
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
    return response.json({
        'status': 'ok',
        'data': []
    })


@bp.post('/delete', name='delete')
@bp.post('/delete/<folder>', name='delete_folder')
@protected
async def delete(request, token, folder=None):
    return response.json({
        'status': 'ok',
        'data': []
    })
