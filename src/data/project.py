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


def get_tagging_task(userid, project_name):
    ret = []
    meta = get_meta(project_name)
    if meta.get('count', 0) == 0:
        return ret
    base_path = get_path_for(project_name)
    # 20 trials to generate 5, in case the random item
    # is already tagged, skip
    indexes_added = set()
    for i in range(0, 20):
        if len(ret) >= 5:
            break
        index = random.randint(1, meta['count'])
        if index in indexes_added:
            continue
        batch_idx = int(index / meta['batch_size']) * meta['batch_size']
        label_filename = os.path.join(base_path, 'label_{}.json'.format(batch_idx))
        label_lockname = os.path.join(base_path, 'label_{}.lock'.format(batch_idx))
        with fasteners.InterProcessReaderWriterLock(label_lockname).read_lock():
            try:
                with open(label_filename, 'rb') as f:
                    labels = orjson.loads(f.read())
            except Exception as e:
                labels = {}
        if (str(index) in labels and
            userid in labels[str(index)]):
            continue
        with open(os.path.join(base_path, str(batch_idx), '{}.json'.format(index)), 'rb') as f:
            c = orjson.loads(f.read())
        c['index'] = index
        ret.append(c)
        indexes_added.add(index)
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
