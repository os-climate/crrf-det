import os
import re
import shlex
import orjson
import subprocess

from sanic.log import logger

import data.file

from .shared import huey_translate, huey_common


@huey_translate.task(context=True)
def initialize_pdf(userid, folder, name, task=None):
    base_path = data.file.get_path(userid, folder)
    input_path = os.path.join(base_path, name)
    output_path = os.path.join(base_path, '.' + name)
    os.makedirs(output_path, exist_ok=True)
    # generate preview & thumbnail
    with open(os.path.join(output_path, 'status'), 'w') as f:
        f.write('rendering')
    cmd = ['/docmt/release/docmt', '-i', input_path, '-o', os.path.join(output_path, 'preview'), '-F', 'jpg', '-P', '750', 'render']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
    while True:
        line = p.stdout.readline()
        if not line:
            break
        logger.info('== {}'.format(line.strip()))
    with open(os.path.join(output_path, 'status'), 'w') as f:
        f.write('thumbnails')
    cmd = ['/docmt/release/docmt', '-i', input_path, '-o', os.path.join(output_path, 'thumb'), '-F', 'jpg', '-P', '200', '-p', '1-5', 'render']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
    while True:
        line = p.stdout.readline()
        if not line:
            break
        logger.info('== {}'.format(line.strip()))
    thumbnails = 0
    for fname in os.listdir(output_path):
        if (not fname.startswith('thumb.') or
            not fname.endswith('.jpg')):
            continue
        parts = fname.split('.')
        fnpage = int(parts[1])
        if fnpage > thumbnails:
            thumbnails = fnpage
    # get page dimensions
    with open(os.path.join(output_path, 'status'), 'w') as f:
        f.write('pages')
    pages = []
    cmd = ['/docmt/release/docmt', '-i', input_path, 'page']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
    p_page = re.compile(r'p([0-9])+ ([0-9]+) \(([0-9\.]+) x ([0-9\.]+)\)')
    while True:
        line = p.stdout.readline()
        if not line:
            break
        logger.info('== {}'.format(line.strip()))
        m = p_page.search(line)
        if m:
            pages.append({'w': float(m.group(3)), 'h': float(m.group(4))})
    json_fn = os.path.join(output_path, 'meta.json')
    with open(json_fn, 'wb') as f:
        f.write(orjson.dumps({
            'pages': pages,
            'thumbs': thumbnails
        }))
    # translate
    cmd = ['./t-pdf', '-i', input_path, '-o', output_path]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
    while True:
        line = p.stdout.readline()
        if not line:
            break
        line = line.strip()
        if (line.startswith('- ') and
            line.endswith('processed')):
            status = line[2:-10]
            with open(os.path.join(output_path, 'status'), 'w') as f:
                f.write('{}'.format(status))
        logger.info('== {}'.format(line.strip()))
    os.remove(os.path.join(output_path, 'status'))


@huey_common.task(context=True)
def search_pdf(userid, folder, name, terms, task=None):
    base_path = data.file.get_path(userid, folder)
    doc_path = os.path.join(base_path, '.' + name)
    search_index_path = os.path.join(doc_path, 'search-index')
    terms = shlex.split(terms)
    terms = ['_' + term[1:] if term.startswith('-') else term for term in terms]
    if not os.path.isdir(search_index_path):
        # build search index
        cmd = ['det-search', 'build', doc_path]
        logger.info('== building search-index for {}'.format(doc_path))
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
        while True:
            line = p.stdout.readline()
            if not line:
                break
            line = line.strip()
            logger.info('== {}'.format(line.strip()))
    output_file = os.path.join(doc_path, 'search_pdf_{}'.format(task.id))
    cmd = ['det-search', 'search', doc_path, *terms]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8')
    output = ''
    while True:
        line = p.stdout.readline()
        if not line:
            break
        output += line
        line = line.strip()
        logger.info('== {}'.format(line.strip()))
    with open(output_file, 'w') as f:
        f.write(output)

