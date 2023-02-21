import os
import psutil
import subprocess
import multiprocessing

from sanic import Sanic
from sanic.log import logger
from sanic.response import json
from sanic_ext import Extend


import service
from task.shared import huey_translate, huey_common


app = Sanic("crrf-det")
app.config.SECRET = os.environ['JWT_SECRET']
app.config.CORS_ORIGINS = 'http://localhost,http://127.0.0.1,{}'.format(os.environ.get('HOST_FE_URL'))
Extend(app)


app.blueprint(service.users.bp)
app.blueprint(service.files.bp)
app.blueprint(service.docs.bp)
app.blueprint(service.filters.bp)
app.blueprint(service.projects.bp)


def launch_huey_consumer():
    cpus = psutil.cpu_count(logical=False)
    workers = max(1, cpus - 2)
    logger.info('initialize {} huey_translate consumers ...'.format(workers))
    p1 = subprocess.Popen(['huey_consumer.py', 'det.huey_translate', '-n', '-m', '2', '-b', '1.05', '-k', 'process', '-w', str(workers)])
    workers = cpus
    logger.info('initialize {} huey_common consumers ...'.format(workers))
    p2 = subprocess.Popen(['huey_consumer.py', 'det.huey_common', '-n', '-m', '2', '-b', '1.05', '-k', 'process', '-w', str(workers)])
    return (p1, p2)


@app.route('/')
async def test(request):
    return json({'hello': 'world'})


@app.main_process_start
async def init(app):
    app.ctx.huey_consumer = launch_huey_consumer()
