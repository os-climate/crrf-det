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
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    ret = data.file.listdir(userid, 'projects', path_func=data.file.get_sys_path)
    return response.json({
        'status':   'ok',
        'data':     ret
    })


@bp.get('/detail/<project_name>')
@protected
async def detail(request, token, project_name):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    project_name = urllib.parse.unquote(project_name)
    project_dir = data.file.get_sys_path(userid, 'projects')
    filename = os.path.join(project_dir, '{}.json'.format(data.file.sanitize_filename(project_name)))
    try:
        with open(filename, 'rb') as f:
            details = orjson.loads(f.read())
    except Exception as e:
        print('error in detail', e)
        raise SanicException('File Not Found', status_code=404)
    run_id = details.get('run_id')
    if run_id is not None:
        project_run_path = data.file.get_user_project_run_dir(userid, run_id)
        master_index_filename = os.path.join(project_run_path, '.master_index.json')
        try:
            with open(master_index_filename, 'rb') as f:
                run_info = orjson.loads(f.read())
        except Exception as e:
            print('error in detail / master_index_filename', e)
        details['run_files'] = run_info.get('files', {})
        details['segments_collected'] = run_info.get('segments_collected', 0)
    return response.json({
        'status':   'ok',
        'data':     details
    })


@bp.post('/run')
@protected
async def run(request, token):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
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
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
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
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    project_run_path = data.file.get_user_project_run_dir(userid, task_id)
    if result_filename is None:
        master_index_filename = os.path.join(project_run_path, '.master_index.json')
        try:
            with open(master_index_filename, 'rb') as f:
                r = orjson.loads(f.read())
        except Exception as e:
            print('error in get_results 1', e)
            raise SanicException('File Not Found', status_code=404)
        r['signature'] = sign.generate_url_signature(userid)
        return response.json({
            'status':   'ok',
            'data':     r
        })
    else:
        result_filename = urllib.parse.unquote(result_filename)
        filename = os.path.join(project_run_path, result_filename)
        try:
            with open(filename, 'rb') as f:
                c = f.read()
                r = orjson.loads(c)
        except Exception as e:
            print('error in get_results 2', e)
            raise SanicException('File Not Found', status_code=404)
        return response.json({
            'status':   'ok',
            'data':     r
        })


@bp.get('/download_results/<task_id>')
async def download_results(request, task_id):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    s = request.args.get('s')
    if not s:
        raise SanicException('File Not Found', status_code=404)
    userid = sign.userid_from_signature(s)
    if userid is None:
        raise SanicException('File Not Found', status_code=404)
    project_run_path = data.file.get_user_project_run_dir(userid, task_id)
    archive_dir = data.file.get_sys_path(userid, 'archives')
    os.makedirs(archive_dir, exist_ok=True)
    shutil.make_archive(os.path.join(archive_dir, 'project_results_{}'.format(task_id)), 'zip', project_run_path)
    return await response.file(os.path.join(archive_dir, 'project_results_{}.zip'.format(task_id)))


@bp.post('/save')
@protected
async def save(request, token):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    project_args = request.json
    if (not project_args.get('name') or
        not project_args.get('files') or
        not project_args.get('filters')):
        raise SanicException('Bad Request', status_code=400)
    project_dir = data.file.get_sys_path(userid, 'projects')
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
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    return response.json({
        'status': 'ok'
    })


@bp.post('/set_tagging/<project_name>')
@protected
async def set_tagging(request, token, project_name):
    if token.get('level', 10000) > 0:   # function requires user level = 0
        raise SanicException('Forbidden.', status_code=403)
    userid = token['id']
    project_name = urllib.parse.unquote(project_name)
    r = task.project.generate_tagging.schedule((userid, project_name), delay=0)
    return response.json({
        'status': 'ok',
        'data': r.id
    })

