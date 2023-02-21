import os
import re
import shlex
import orjson
import subprocess

from sanic.log import logger

import data.file

from .shared import huey_common


def build_and_search(userid, folder, name, terms, run_id):
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
    output_file = os.path.join(doc_path, 'search_pdf_{}'.format(run_id))
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


@huey_common.task(context=True)
def run(userid, folder, name, terms, task=None):
    build_and_search(userid, folder, name, terms, task.id)
