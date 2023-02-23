import os
import csv
import time
import hashlib
import fasteners


class User:

    @staticmethod
    def hash_password(password):
        h = hashlib.blake2b(digest_size=25)
        h.update(password.encode('utf-8'))
        h.update(b'crrf-det-salt-50-10-15')
        return h.hexdigest()

    @staticmethod
    def generate_id():
        h = hashlib.blake2b(digest_size=10)
        h.update(str(time.time()).encode('utf-8'))
        h.update(b'crrf-det-salt-50-10-15')
        return h.hexdigest()

    # mostly for compatibility with jwt
    def __init__(self, id, username, level):
        self.id = id
        self.username = username
        self.level = level

    def __repr__(self):
        return '{}/{}'.format(self.id, self.level)

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'level': self.level}


USER_DATABASE_PATH = '/data/users'


class user_database(object):

    def __init__(self, mode):
        self.mode = mode
        self.lock = fasteners.InterProcessReaderWriterLock('{}.lock'.format(USER_DATABASE_PATH))

    def __enter__(self):
        self.f = open(USER_DATABASE_PATH, self.mode, newline='')
        if self.mode == 'r':
            self.lock.acquire_read_lock()
            return csv.reader(self.f)
        elif self.mode in ['w', 'a']:
            self.lock.acquire_write_lock()
            return csv.writer(self.f)
        else:
            raise Exception('unknown user_database i/o mode {}'.format(self.mode))

    def __exit__(self, *args):
        if self.mode == 'r':
            self.lock.release_read_lock()
        elif self.mode in ['w', 'a']:
            self.lock.release_write_lock()
        self.f.close()


def add(username, password, level):
    username = username.lower()
    try:
        with user_database('r') as r:
            for row in r:
                if row[1] == username:
                    raise Exception('username already exists')
    except FileNotFoundError:
        pass
    with user_database('a') as w:
        w.writerow([User.generate_id(), str(username), User.hash_password(password), str(level)])
    return True


def login(username, password):
    username = username.lower()
    try:
        with user_database('r') as r:
            for row in r:
                if (row[1] == username and
                    row[2] == User.hash_password(password)):
                    return (row[0], int(row[3]))
    except FileNotFoundError:
        pass
    return (None, -1)


def passwd(username, old_password, new_password):
    (userid, level) = login(username, old_password)
    if level < 0:
        return False
    try:
        found = False
        rows = []
        with user_database('r') as r:
            for row in r:
                if (row[1] == username and
                    row[2] == User.hash_password(old_password)):
                    found = True
                    row[2] = User.hash_password(new_password)
                rows.append(row)
        if found:
            with user_database('w') as w:
                for row in rows:
                    w.writerow(row)
            return True
        else:
            return False
    except FileNotFoundError:
        return False


