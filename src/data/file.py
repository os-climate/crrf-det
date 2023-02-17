import os
import shutil
import orjson

from datetime import datetime, timezone


FILE_BASE_PATH = '/data/files'


def sanitize_filename(filename):
    return filename.replace(':', '_').replace('/', '_').replace('\\', '_').strip('.')


def get_path(userid, folder):
    user_path = os.path.join(FILE_BASE_PATH, userid)
    if folder is not None:
        folder_path = '/'.join([sanitize_filename(x) for x in folder.split('|')])
        user_path = os.path.join(user_path, folder_path)
    return user_path


def _is_pathname_valid(name):
    if (name is not None and
        (name.startswith('.') or
        '/' in name or
        '*' in name)):
        return False
    return True


def listdir(userid, folder):
    ret = []
    user_path = get_path(userid, folder)
    try:
        with os.scandir(user_path) as it:
            for entry in it:
                if entry.name.startswith('.'):
                    continue
                etype = 'folder' if entry.is_dir() else 'file'
                sr = entry.stat()
                fe = {
                    'type': etype,
                    'name': entry.name,
                    'size': sr.st_size,
                    'date': datetime.fromtimestamp(sr.st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat(),
                    'info': ''
                }
                if etype == 'file':
                    fe['info'] = {
                        'status': 'Queued'
                    }
                    work_path = os.path.join(user_path, '.' + entry.name)
                    try:
                        with open(os.path.join(work_path, 'meta.json')) as f:
                            meta = orjson.loads(f.read())
                            fe['info'] = '{} pages'.format(len(meta['pages']))
                            fe['thumbs'] = meta.get('thumbs', 0)
                    except FileNotFoundError:
                        pass
                    except Exception as e:
                        print('meta read exception', e, user_path, entry.name)
                    try:
                        with open(os.path.join(work_path, 'status')) as f:
                            pages = f.read()
                            fe['info'] = {
                                'status': 'Processing ({}) ...'.format(pages)
                            }
                    except FileNotFoundError:
                        pass
                    except Exception as e:
                        print('status read exception', e, user_path, entry.name)
                ret.append(fe)
    except FileNotFoundError:
        pass
    return ret


def get_meta(userid, folder, name):
    if (not _is_pathname_valid(folder) or
        not _is_pathname_valid(name)):
        return False
    user_path = get_path(userid, folder)
    work_path = os.path.join(user_path, '.' + name)
    try:
        with open(os.path.join(work_path, 'meta.json')) as f:
            meta = orjson.loads(f.read())
            return meta
    except Exception as e:
        pass
    return {}


def mkdir(userid, parent_folder, name):
    if (not _is_pathname_valid(parent_folder) or
        not _is_pathname_valid(name)):
        return False
    user_path = get_path(userid, parent_folder)
    target_dir = os.path.join(user_path, name)
    try:
        os.makedirs(target_dir, exist_ok=True)
    except Exception as e:
        print("error in mkdir", e)
        return False
    return True


def mv(userid, parent_folder, name, new_name):
    if (not _is_pathname_valid(parent_folder) or
        not _is_pathname_valid(name) or
        not _is_pathname_valid(new_name)):
        return False
    user_path = get_path(userid, parent_folder)
    src = os.path.join(user_path, name)
    dst = os.path.join(user_path, new_name)
    try:
        shutil.move(src, dst)
    except Exception as e:
        print("error in mv", e)
        return False
    return True


def rm(userid, parent_folder, name):
    if (not _is_pathname_valid(parent_folder) or
        not _is_pathname_valid(name)):
        return False
    user_path = get_path(userid, parent_folder)
    path_delete = os.path.join(user_path, name)
    try:
        if os.path.isfile(path_delete):
            os.remove(path_delete)
            hidden_pkg = os.path.join(user_path, '.' + name)
            shutil.rmtree(hidden_pkg)
        elif os.path.isdir(path_delete):
            shutil.rmtree(path_delete)
    except Exception as e:
        print('error in rm', e)
        return False
    return True


def write(userid, parent_folder, filename, content):
    if not _is_pathname_valid(parent_folder):
        return None
    filename = sanitize_filename(filename)
    user_path = get_path(userid, parent_folder)
    try:
        os.makedirs(user_path, exist_ok=True)
    except Exception as e:
        print("error in write (mkdir)", e)
        return None
    try:
        with open(os.path.join(user_path, filename), 'wb') as f:
            f.write(content)
    except Exception as e:
        print("error in write", e)
        return None
    return filename


def set_working_task(userid, parent_folder, filename, task_type, task_id):
    if not _is_pathname_valid(parent_folder):
        return False
    filename = sanitize_filename(filename)
    user_path = get_path(userid, parent_folder)
    work_path = os.path.join(user_path, '.' + filename)
    try:
        os.makedirs(work_path, exist_ok=True)
    except Exception as e:
        print("error in set_working_task (mkdir)", e)
        return False
    try:
        with open(os.path.join(work_path, 'task,{},{}'.format(task_type, task_id)), 'wb') as f:
            f.write(b'1')
    except Exception as e:
        print("error in set_working_task", e)
        return False
    return True


def get_working_task(userid, parent_folder, filename):
    if not _is_pathname_valid(parent_folder):
        return (None, None)
    filename = sanitize_filename(filename)
    user_path = get_path(userid, parent_folder)
    work_path = os.path.join(user_path, '.' + filename)
    try:
        for fname in os.listdir(work_path):
            if not fname.startswith('task,'):
                continue
            parts = fname.split(',')
            if len(parts) != 3:
                continue
            return (parts[1], parts[2]);
    except Exception as e:
        print("error in get_working_task", e)
    return (None, None)


def get_user_file(userid, parent_folder, filename, page):
    if not _is_pathname_valid(parent_folder):
        return None
    filename = sanitize_filename(filename)
    user_path = get_path(userid, parent_folder)
    work_path = os.path.join(user_path, '.' + filename)
    filename = os.path.join(work_path, page)
    if os.path.isfile(filename):
        return filename
    return None


def get_user_settings(userid, name):
    name = sanitize_filename(name)
    user_path = get_path(userid, None)
    filename = os.path.join(user_path, '.' + name + '.json')
    try:
        with open(filename) as f:
            return orjson.loads(f.read())
    except Exception as e:
        return {}


def save_user_settings(userid, name, settings):
    name = sanitize_filename(name)
    user_path = get_path(userid, None)
    filename = os.path.join(user_path, '.' + name + '.json')
    try:
        with open(filename, 'wb') as f:
            f.write(orjson.dumps(settings))
    except Exception as e:
        pass

