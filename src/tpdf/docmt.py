import os
import re
import html
import tempfile
import subprocess
import skimage.io


DOCMT_BIN=''
PDFTOTEXT_BIN=''


def search_for_docmt_bin():
    global DOCMT_BIN
    global PDFTOTEXT_BIN
    if DOCMT_BIN:
        return
    paths = [
        '/docmt/release/docmt',
        '/docmt/docmt',
    ]
    PDFTOTEXT_BIN = '/usr/bin/pdftotext'
    for filename in paths:
        if os.path.isfile(filename):
            DOCMT_BIN = filename
            return
    raise Exception('docmt is not found')


def load_page_image(filename, page, text_only=True):
    global DOCMT_BIN
    with tempfile.TemporaryDirectory() as tmp_dir:
        cmd = ['-i', filename, '-o', '{}/p'.format(tmp_dir), '-F', 'jpg', '-p', str(page)]
        if text_only:
            cmd.append('-T')
        r = subprocess.run([DOCMT_BIN, *cmd, 'render'], capture_output=True)
        img_filename = os.path.join(tmp_dir, 'p.{}.jpg'.format(page))
        ret = skimage.io.imread(img_filename)
    return ret


def load_page_text(filename, page):
    global PDFTOTEXT_BIN
    with tempfile.TemporaryDirectory() as tmp_dir:
        text_p = re.compile(r'<doc>(.+)</doc>', re.DOTALL)
        txt_filename = '{}/p.txt'.format(tmp_dir)
        cmd = ['-bbox', '-f', str(page), '-l', str(page), filename, '{}/p.txt'.format(tmp_dir)]
        r = subprocess.run([PDFTOTEXT_BIN, *cmd], capture_output=True)
        with open(txt_filename) as f:
            ret = f.read()
            m = text_p.search(ret)
            if m:
                return m.group(1)
    return ''


def load_page_content(filename, page):
    text = load_page_text(filename, page)
    ret = {}
    page_attrs = {
        'number': page
    }
    p_page_attrs = re.compile(r'<page ([^=]+)="([^"]+)" ([^=]+)="([^"]+)"')
    m = p_page_attrs.search(text)
    if m:
        page_attrs[m.group(1)] = float(m.group(2))
        page_attrs[m.group(3)] = float(m.group(4))

    p_word_attrs = re.compile(r'<word ([^=]+)="([^"]+)" ([^=]+)="([^"]+)" ([^=]+)="([^"]+)" ([^=]+)="([^"]+)">([^<]+)</word>')
    words = []
    for m in p_word_attrs.finditer(text):
        w = {
            m.group(1).lower(): float(m.group(2)),
            m.group(3).lower(): float(m.group(4)),
            m.group(5).lower(): float(m.group(6)),
            m.group(7).lower(): float(m.group(8)),
            'text': html.unescape(m.group(9))
        }
        words.append(w)

    ret = {
        'page': page_attrs,
        'words': words
    }
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
