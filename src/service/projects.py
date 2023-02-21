import os
import pickle
import orjson
import shutil
import urllib.parse

from sanic import response, Blueprint
from sanic.exceptions import SanicException

import data.file
import task.project

from . import sign, utils
from .auth import protected
from task.shared import kvdb


bp = Blueprint('projects', url_prefix='/projects')


@bp.get('/')
@protected
async def index(request, token):
    userid = token['id']
    return response.json({
        'status': 'ok'
    })


@bp.post('/run')
@protected
async def run(request, token):
    userid = token['id']
    path = utils.fix_folder(request.json.get('path'))
    files = request.json.get('files')
    filters = request.json.get('filters')
    if not files:
        raise SanicException('Bad Request', status_code=400)
    if not filters:
        raise SanicException('Bad Request', status_code=400)
    r = task.project.run.schedule((userid, path, files, filters), delay=0)
    # 432,000 sec = 5 days
    kvdb.setex('{}_{}'.format(userid, r.id), 432000, pickle.dumps({
        'step': 0,
        'total': 1,
        'message': 'Running'
    }))
    return response.json({
        'status':   'ok',
        'data':     r.id
    })


@bp.get('/is_finished/<task_id>')
@protected
async def is_finished(request, token, task_id):
    userid = token['id']
    ret = kvdb.get('{}_{}'.format(userid, task_id))
    if ret:
        ret = pickle.loads(ret)
    return response.json({
        'status':   'ok',
        'data':     ret
    })


@bp.get('/results/<task_id>')
@bp.get('/results/<task_id>/<result_filename>')
@protected
async def get_results(request, token, task_id, result_filename=None):
    userid = token['id']
    if result_filename is None:
        master_index_filename = data.file.get_user_file(userid, None, 'project_run_{}'.format(task_id), '.master_index.json')
        try:
            with open(master_index_filename, 'rb') as f:
                r = orjson.loads(f.read())
        except Exception as e:
            print('error in get_results', e)
            raise SanicException('File Not Found', status_code=404)
        r['signature'] = sign.generate_url_signature(userid)
        return response.json({
            'status':   'ok',
            'data':     r
        })
    else:
        result_filename = urllib.parse.unquote(result_filename)
        filename = data.file.get_user_file(userid, None, 'project_run_{}'.format(task_id), result_filename)
        if filename is None:
            raise SanicException('File Not Found', status_code=404)
        with open(filename, 'rb') as f:
            c = f.read()
            r = orjson.loads(c)
        return response.json({
            'status':   'ok',
            'data':     r
        })


@bp.get('/download_results/<task_id>')
async def download_results(request, task_id):
    s = request.args.get('s')
    if not s:
        raise SanicException('File Not Found', status_code=404)
    userid = sign.userid_from_signature(s)
    if userid is None:
        raise SanicException('File Not Found', status_code=404)
    project_base_path = os.path.join(data.file.get_path(userid, None), '.project_run_{}'.format(task_id))
    archive_dir = os.path.join(data.file.get_path(userid, None), '.archives')
    os.makedirs(archive_dir, exist_ok=True)
    shutil.make_archive(os.path.join(archive_dir, 'project_results_{}'.format(task_id)), 'zip', project_base_path)
    return await response.file(os.path.join(archive_dir, 'project_results_{}.zip'.format(task_id)))


@bp.post('/save')
@protected
async def save(request, token):
    userid = token['id']
    project_args = request.json
    print('save', project_args)
    if (not project_args.get('name') or
        not project_args.get('files') or
        not project_args.get('filters')):
        raise SanicException('Bad Request', status_code=400)
    project_dir = os.path.join(data.file.get_path(userid, None), '.projects')
    os.makedirs(project_dir, exist_ok=True)
    filename = os.path.join(project_dir, '{}.json'.format(data.file.sanitize_filename(project_args.get('name'))))
    with open(filename, 'wb') as f:
        f.write(orjson.dumps(project_args))
    return response.json({
        'status': 'ok'
    })


@bp.post('/delete/<project_name>')
@protected
async def delete(request, token, project_name):
    userid = token['id']
    return response.json({
        'status': 'ok'
    })
