import os
import re
import shlex
import orjson
import pickle
import subprocess

from sanic.log import logger

import data.file

from .search import build_and_search
from .shared import huey_common, kvdb


@huey_common.task(context=True)
def run(userid, path, files, filters, task=None):
    user_filters = data.file.get_user_settings(userid, 'filters')
    project_base_path = os.path.join(data.file.get_path(userid, None), '.project_run_{}'.format(task.id))
    os.makedirs(project_base_path, exist_ok=True)
    logger.info('PR -- {} --'.format(project_base_path))
    filter_count = 0
    for filter_name in filters:
        if filter_name not in user_filters:
            logger.warn('PR filter {} not found'.format(filter_name))
            continue
        filter_count += 1
    ret = data.file.enumerate_user_files(userid, path, files)
    logger.info('PR {} files:'.format(len(ret)))
    total_steps = len(ret) * filter_count
    cur_step = 1
    # 432,000 sec = 5 days
    kvdb.setex('{}_{}'.format(userid, task.id), 432000, pickle.dumps({
        'step':     cur_step,
        'total':    total_steps,
        'message':  '{} files, {} filters'.format(len(ret), filter_count)
    }))
    for (folder, file) in ret:
        logger.info('PR - {} {}'.format(folder, file))
    master_index = {
        'files': {},
        'segments_collected': 0
    }
    for file_idx, (folder, file) in enumerate(ret):
        logger.info('PR file {} of {}: {} {} ...'.format(file_idx + 1, len(ret), folder, file))
        if folder is None:
            norm_filename = file
        else:
            norm_filename = '{}_{}'.format(folder.replace('|', '_'), file)
        file_result = {}
        master_index['files'][norm_filename] = 0
        for filter_idx, (filter_name, labels) in enumerate(filters.items()):
            if filter_name not in user_filters:
                continue
            query = user_filters[filter_name]['query']
            logger.info('PR[{}/{}] - filter: {}, query: {} ...'.format(cur_step, total_steps, filter_name, query))
            kvdb.setex('{}_{}'.format(userid, task.id), 432000, pickle.dumps({
                'step':     cur_step,
                'total':    total_steps,
                'message':  'Running filter "{}" against "{}" ... ({} segments collected)'.format(filter_name, file, master_index['segments_collected'])
            }))
            build_and_search(userid, folder, file, query, task.id)
            base_path = data.file.get_path(userid, folder)
            doc_path = os.path.join(base_path, '.' + file)
            output_file = os.path.join(doc_path, 'search_pdf_{}'.format(task.id))
            if os.path.isfile(output_file):
                with open(output_file, 'rb') as f:
                    results = orjson.loads(f.read())
                for result in results:
                    page = result['page']
                    if page not in file_result:
                        file_result[page] = {}
                    page_file = data.file.get_user_file(userid, folder, file, 'page.{}.json'.format(page))
                    with open(page_file, 'rb') as f:
                        page_content = orjson.loads(f.read())
                    for cindex in result['cindex']:
                        if cindex not in file_result[page]:
                            file_result[page][cindex] = {
                                'content': page_content['content'][cindex],
                                'labels': [ labels ]
                            }
                            master_index['segments_collected'] += 1
                            master_index['files'][norm_filename] += 1
                        else:
                            file_result[page][cindex]['labels'].append(labels)
                os.remove(output_file)
            else:
                logger.error('PR failed')
            cur_step += 1
        file_result_filename = os.path.join(project_base_path, norm_filename)
        with open(file_result_filename, 'wb') as f:
            f.write(orjson.dumps(file_result, option=orjson.OPT_NON_STR_KEYS))
        logger.info('PR - {} saved'.format(file_result_filename))
    master_index_filename = os.path.join(project_base_path, '.master_index.json')
    with open(master_index_filename, 'wb') as f:
        f.write(orjson.dumps(master_index))
    kvdb.delete('{}_{}'.format(userid, task.id))
