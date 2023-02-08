import os
import subprocess
import multiprocessing

from sanic import Sanic
from sanic.log import logger
from sanic.response import json
from sanic_ext import Extend


import service
from task.shared import huey


app = Sanic("crrf-det")
app.config.SECRET = os.environ['JWT_SECRET']
app.config.CORS_ORIGINS = 'http://localhost,http://127.0.0.1'
Extend(app)


app.blueprint(service.users.bp)
app.blueprint(service.files.bp)
app.blueprint(service.docs.bp)


def launch_huey_consumer():
    cpus = multiprocessing.cpu_count()
    workers = max(1, cpus - 1)
    logger.info('initialize {} huey consumers ...'.format(workers))
    return subprocess.Popen(['huey_consumer.py', 'det.huey', '-k', 'process', '-w', str(workers)])


@app.route('/')
async def test(request):
    return json({'hello': 'world'})


@app.main_process_start
async def init(app):
    app.ctx.huey_consumer = launch_huey_consumer()

