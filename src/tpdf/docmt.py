import os
import random
import shutil
import tempfile
import subprocess
import skimage.io


DOCMT_BIN=''


def search_for_docmt_bin():
    global DOCMT_BIN
    if DOCMT_BIN:
        return
    paths = [
        '/docmt/release/docmt',
        '/docmt/docmt',
    ]
    for filename in paths:
        if os.path.isfile(filename):
            DOCMT_BIN = filename
            return
    raise Exception('docmt is not found')


def load_page_image(filename, page, text_only=True):
    global DOCMT_BIN
    tmp_dir = os.path.join(tempfile.gettempdir(), ''.join(random.sample("abcdefghijklmnopqrstuvwxyz1234567890", 21)))
    os.makedirs(tmp_dir)
    cmd = ['-i', filename, '-o', '{}/p'.format(tmp_dir), '-F', 'jpg', '-p', str(page)]
    if text_only:
        cmd.append('-T')
    r = subprocess.run([DOCMT_BIN, *cmd, 'render'], capture_output=True)
    # print(r.stdout.decode('utf-8'))
    # print(r.stderr.decode('utf-8'))
    img_filename = os.path.join(tmp_dir, 'p.{}.jpg'.format(page))
    ret = skimage.io.imread(img_filename)
    shutil.rmtree(tmp_dir)
    return ret


def get_info(filename):
    global DOCMT_BIN
    cmd = ['-i', filename]
    p = subprocess.Popen([DOCMT_BIN, *cmd, 'preview'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    r = p.communicate()
    ret = {}
    do_parse = False
    for line in r[0].decode('utf-8').split('\n'):
        if line == '[essential]':
            do_parse = True
            continue
        elif line.startswith('['):
            break
        if do_parse:
            (key, value) = line.split(' ')
            try:
                ret[key] = int(value)
            except ValueError:
                ret[key] = value
    return ret


search_for_docmt_bin()
