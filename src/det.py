from sanic import Sanic
from sanic.response import json


import service


app = Sanic("crrf-det")
app.config.SECRET = 'crrf-det-jwt-SECRET!!!501015'


app.blueprint(service.users.bp)
app.blueprint(service.files.bp)
app.blueprint(service.docs.bp)


@app.route('/')
async def test(request):
    return json({'hello': 'world'})


if __name__ == '__main__':
    app.run()
