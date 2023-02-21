import os
import redis

from huey import RedisHuey


huey_translate = RedisHuey(name='det_translate', host='172.17.0.1', port=os.environ.get('REDIS_PORT', 6379))
huey_common = RedisHuey(name='det_common', host='172.17.0.1', port=os.environ.get('REDIS_PORT', 6379))
kvdb = redis.Redis(host='172.17.0.1', port=os.environ.get('REDIS_PORT', 6379), db=0)
