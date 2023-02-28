import os
import re
import shlex
import orjson
import pickle
import subprocess

from sanic.log import logger

import data.file
import data.project

from tpdf.pseg import calc_target_scale
from .search import build_and_search
from .shared import huey_common, kvdb


@huey_common.task(context=True)
def run(userid, path, files, filters, task=None):
    user_filters = data.file.get_user_settings(userid, 'filters')
    project_run_path = data.file.get_user_project_run_dir(userid, task.id)
    os.makedirs(project_run_path, exist_ok=True)
    logger.info('PR -- {} --'.format(project_run_path))
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
    file_map = {}
    for file_idx, (folder, file) in enumerate(ret):
        logger.info('PR file {} of {}: {} {} ...'.format(file_idx + 1, len(ret), folder, file))
        if folder is None:
            norm_filename = file
        else:
            norm_filename = '{}_{}'.format(folder.replace('|', '_'), file)
        file_result = {}
        master_index['files'][norm_filename] = 0
        file_map[norm_filename] = (folder, file)
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
            doc_path = data.file.get_user_doc_dir(userid, folder, file)
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
        file_result_filename = os.path.join(project_run_path, norm_filename)
        with open(file_result_filename, 'wb') as f:
            f.write(orjson.dumps(file_result, option=orjson.OPT_NON_STR_KEYS))
        logger.info('PR - {} saved'.format(file_result_filename))
    master_index_filename = os.path.join(project_run_path, '.master_index.json')
    with open(master_index_filename, 'wb') as f:
        f.write(orjson.dumps(master_index))
    file_map_filename = os.path.join(project_run_path, '.file_map.json')
    with open(file_map_filename, 'wb') as f:
        f.write(orjson.dumps(file_map))
    kvdb.delete('{}_{}'.format(userid, task.id))


@huey_common.task(context=True)
def generate_tagging(userid, project_name, task=None):
    box_coords_narrowside = 400
    batch_size = 1000
    project_dir = data.file.get_sys_path(userid, 'projects')
    output_dir = data.project.get_path_for(data.file.sanitize_filename(project_name))
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.join(project_dir, '{}.json'.format(data.file.sanitize_filename(project_name)))
    with open(filename, 'rb') as f:
        proj_def = orjson.loads(f.read())
    run_id = proj_def.get('run_id')
    if not run_id:
        return
    project_run_path = data.file.get_user_project_run_dir(userid, run_id)
    master_index_filename = os.path.join(project_run_path, '.master_index.json')
    file_map_filename = os.path.join(project_run_path, '.file_map.json')
    try:
        with open(master_index_filename, 'rb') as f:
            master_index = orjson.loads(f.read())
    except Exception as e:
        return
    try:
        with open(file_map_filename, 'rb') as f:
            file_map = orjson.loads(f.read())
    except Exception as e:
        return
    total_count = 0
    for file_dx, filename in enumerate(master_index.get('files', [])):
        segs_filename = os.path.join(project_run_path, filename)
        with open(segs_filename, 'rb') as f:
            doc_segs = orjson.loads(f.read())
        for page_idx, segs in doc_segs.items():
            total_count += len(segs)
    # 432,000 sec = 5 days
    kvdb.setex('{}_{}'.format(userid, task.id), 432000, pickle.dumps({
        'step':     0,
        'total':    total_count,
        'message':  '{} files'.format(len(master_index.get('files', [])))
    }))
    entry_count = 0
    for file_dx, filename in enumerate(master_index.get('files', [])):
        segs_filename = os.path.join(project_run_path, filename)
        [doc_folder, doc_filename] = file_map[filename]
        doc_fullpath = os.path.join(data.file.get_path(userid, doc_folder), doc_filename)
        with open(segs_filename, 'rb') as f:
            doc_segs = orjson.loads(f.read())
        for page_idx, segs in doc_segs.items():
            logger.info('{} {}'.format(doc_fullpath, page_idx))
            cmd = ['/docmt/release/docmt', '-i', doc_fullpath, '-o', os.path.join(output_dir, filename), '-F', 'jpg', '-P', '1200', '-p', str(page_idx), 'render']
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
            width = 0
            height = 0
            while True:
                line = p.stdout.readline()
                if line.startswith('saved image for'):
                    bl = line.find('(')
                    br = line.find(')')
                    dim_part = line[bl + 1:br]
                    n1, n2 = dim_part.split('x')
                    width = int(n1)
                    height = int(n2)
                if not line:
                    break
                logger.info('== {}'.format(line.strip()))
            target_scale = calc_target_scale(width, height)
            for cidx, seg in segs.items():
                entry_count += 1
                batch_index = '{}'.format(int(entry_count / batch_size) * batch_size)
                batch_out_dir = os.path.join(output_dir, batch_index)
                os.makedirs(batch_out_dir, exist_ok=True)
                # generate crop
                crop_y_start = int(seg['content']['box'][0] * target_scale / 8) * 8
                crop_x_start = int(seg['content']['box'][1] * target_scale / 8) * 8
                crop_y_end = int(seg['content']['box'][2] * target_scale / 8 + 1) * 8
                crop_x_end = int(seg['content']['box'][3] * target_scale / 8 + 1) * 8
                crop_width = crop_x_end - crop_x_start
                crop_height = crop_y_end - crop_y_start
                cmd = ['jpegtran', '-outfile', os.path.join(batch_out_dir, '{}.jpg'.format(entry_count)), '-crop', '{}x{}+{}+{}'.format(crop_width, crop_height, crop_x_start, crop_y_start), os.path.join(output_dir, '{}.{}.jpg'.format(filename, page_idx))]
                p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
                while True:
                    if type(p.stdout) is str:
                        break
                    line = p.stdout.readline()
                    if not line:
                        break
                    logger.info('== {}'.format(line.strip()))
                crop_sizes = [[crop_width, crop_height]]
                # Split a single crop into as many as 3 to get practical
                # display on mobile devices. Split parameters are based
                # on "narrow side 1200px" settings in `docmt` run.
                margins = []
                if crop_width / crop_height >= 2:
                    if crop_width >= 2000:
                        # split into 4 horizontal blocks
                        unit_width = crop_width / 4
                        margins = [
                            [0, int(unit_width / 8 + 1) * 8],
                            [int(unit_width / 8 - 1) * 8, int(2 * unit_width / 8 + 1) * 8],
                            [int(2 * unit_width / 8 - 1) * 8, int(3 * unit_width / 8 + 1) * 8],
                            [int(3 * unit_width / 8 - 1) * 8, crop_width]
                        ]
                    elif crop_width >= 1400:
                        # split into 3 horizontal blocks
                        unit_width = crop_width / 3
                        margins = [
                            [0, int(unit_width / 8 + 1) * 8],
                            [int(unit_width / 8 - 1) * 8, int(2 * unit_width / 8 + 1) * 8],
                            [int(2 * unit_width / 8 - 1) * 8, crop_width]
                        ]
                    elif crop_width >= 800:
                        # split into 2 horizontal blocks
                        unit_width = crop_width / 2
                        margins = [
                            [0, int(unit_width / 8 + 1) * 8],
                            [int(unit_width / 8 - 1) * 8, crop_width],
                        ]
                    if margins:
                        crop_sizes = []
                    for midx, (ml, mr) in enumerate(margins):
                        crop_sizes.append([mr - ml, crop_height])
                        cmd = ['jpegtran', '-outfile', os.path.join(batch_out_dir, '{}_{}.jpg'.format(entry_count, midx + 1)), '-crop', '{}x{}+{}+{}'.format(mr - ml, crop_height, ml, 0), os.path.join(batch_out_dir, '{}.jpg'.format(entry_count))]
                        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
                        while True:
                            if type(p.stdout) is str:
                                break
                            line = p.stdout.readline()
                            if not line:
                                break
                            logger.info('== {}'.format(line.strip()))
                # generate json segment
                labels = []
                for label_set in seg['labels']:
                    label_set = [x.strip() for x in label_set]
                    if label_set in labels:
                        continue
                    labels.append(label_set)
                tseg = {
                    'filename': filename,
                    'page':     int(page_idx),
                    'cidx':     int(cidx),
                    'type':     seg['content']['type'],
                    'content':  seg['content']['content'],
                    'box':      seg['content']['box'],
                    'labels':   labels,
                    'crop_sizes':   crop_sizes
                }
                with open(os.path.join(batch_out_dir, '{}.json'.format(entry_count)), 'wb') as f:
                    f.write(orjson.dumps(tseg))
            kvdb.setex('{}_{}'.format(userid, task.id), 432000, pickle.dumps({
                'step':     entry_count,
                'total':    total_count,
                'message':  '{} ({} collected)'.format(filename, entry_count)
            }))
    with open(os.path.join(output_dir, 'meta.json'), 'wb') as f:
        f.write(orjson.dumps({
            'count': entry_count,
            'batch_size': batch_size
        }))
    kvdb.delete('{}_{}'.format(userid, task.id))

