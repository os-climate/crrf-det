from sanic import response, Blueprint
from .auth import protected


bp = Blueprint('docs', url_prefix='/docs')


@bp.get('/<id>')
@protected
async def view(request, token, id):
    # token: {'id': '4cbbf5c3160224c6f212', 'username': 'admin', 'level': 0, 'exp': 1675340593}
    print('docs.view', token, id)
    return response.json({
        'status': 'ok',
        'data': {}
    })


@bp.get('/<id>/<page>')
@protected
async def view_page(request, token, id, page):
    print('docs.view_page', token, id, page)
    return response.json({
        'status': 'ok',
        'data': {}
    })
