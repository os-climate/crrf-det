from sanic import response, Blueprint


bp = Blueprint('files', url_prefix='/files')


@bp.get('/')
async def index(request):
    print('files.index')
    return response.json({
        'status': 'ok',
        'data': []
    })


@bp.get('/<folder>')
async def folder_index(request, folder):
    print('files.folder_index', folder)
    return response.json({
        'status': 'ok',
        'data': []
    })


@bp.post('/')
async def upload(request):
    return response.json({
        'status': 'ok',
        'data': []
    })


@bp.put('/')
async def change(request):
    return response.json({
        'status': 'ok',
        'data': []
    })


@bp.delete('/')
async def delete(request):
    return response.json({
        'status': 'ok',
        'data': []
    })
