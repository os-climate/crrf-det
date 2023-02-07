import os
import io
import zlib
import base64
import orjson

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from datetime import datetime, timezone, timedelta


def generate_key():
    return os.urandom(16).hex()


def generate_url_signature(userid):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(bytes.fromhex(os.environ['URL_SIGN_SECRET'])), modes.OFB(iv))
    enc = cipher.encryptor()
    bytes_ = orjson.dumps({'id': userid, 'exp': (datetime.now(tz=timezone.utc) + timedelta(hours=1)).timestamp()})
    token = enc.update(zlib.compress(bytes_, level=9)) + enc.finalize()
    return base64.urlsafe_b64encode(token + iv).decode('utf-8')


def userid_from_signature(signature):
    token = base64.urlsafe_b64decode(signature)
    iv = token[-16:]
    token = token[:-16]
    cipher = Cipher(algorithms.AES(bytes.fromhex(os.environ['URL_SIGN_SECRET'])), modes.OFB(iv))
    dec = cipher.decryptor()
    zbytes = dec.update(token) + dec.finalize()
    bytes_ = zlib.decompress(zbytes)
    obj = orjson.loads(bytes_)
    now = datetime.now(tz=timezone.utc).timestamp()
    exp = obj.get('exp', now)
    if exp > now:
        return obj.get('id', None)
    return None
