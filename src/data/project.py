import os
import random
import orjson
import fasteners


PROJECT_BASE_PATH = '/data/projects'


def get_path_for(project_name):
    return os.path.join(PROJECT_BASE_PATH, project_name)


def get_meta(project_name):
    try:
        with open(os.path.join(get_path_for(project_name), 'meta.json'), 'rb') as f:
            return orjson.loads(f.read())
    except Exception as e:
        print('get_meta error for {}: {}'.format(project_name, e))
    return {}


def list_all():
    ret = []
    for entry in os.listdir(PROJECT_BASE_PATH):
        if entry.startswith('.'):
            continue
        ret.append(entry)
    return ret


def get_tagging_task(project_name):
    ret = []
    meta = get_meta(project_name)
    if meta.get('count', 0) == 0:
        return ret
    base_path = get_path_for(project_name)
    # generate 5
    for i in range(0, 5):
        idx = random.randint(1, meta['count'])
        batch_idx = int(idx / meta['batch_size']) * meta['batch_size']
        with open(os.path.join(base_path, str(batch_idx), '{}.json'.format(idx)), 'rb') as f:
            c = orjson.loads(f.read())
        c['index'] = idx
        ret.append(c)
    return ret


def get_tagging_image(project_name, index):
    meta = get_meta(project_name)
    if meta.get('count', 0) == 0:
        return ''
    base_path = get_path_for(project_name)
    batch_idx = int(int(index) / meta['batch_size']) * meta['batch_size']
    return os.path.join(base_path, str(batch_idx), '{}.jpg'.format(index))


def set_label(project_name, index, userid, label):
    meta = get_meta(project_name)
    if meta.get('count', 0) == 0:
        return False
    base_path = get_path_for(project_name)
    batch_idx = int(int(index) / meta['batch_size']) * meta['batch_size']
    label_filename = os.path.join(base_path, 'label_{}.json'.format(batch_idx))
    label_lockname = os.path.join(base_path, 'label_{}.lock'.format(batch_idx))
    with fasteners.InterProcessReaderWriterLock(label_lockname).read_lock():
        try:
            with open(label_filename, 'rb') as f:
                labels = orjson.loads(f.read())
        except Exception as e:
            print('set_label exception', e)
            labels = {}
    if index not in labels:
        labels[index] = {}
    if userid not in labels[index]:
        labels[index][userid] = []
    labels[index][userid].append(label)
    with fasteners.InterProcessReaderWriterLock(label_lockname).write_lock():
        with open(label_filename, 'wb') as f:
            f.write(orjson.dumps(labels))
