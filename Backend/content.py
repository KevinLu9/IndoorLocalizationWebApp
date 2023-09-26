from datetime import datetime
from flask import abort
from config import db
from models import Content, ContentSchema


def get_timestamp():
    return datetime.now().strftime(("%Y-%m-%d %H:%M:%S"))


def read(id):
    content = Content.query.filter_by(id = id).all()
    return ContentSchema(many=True).dump(content)

def update(request):
    id = request.get("id")
    content = request.get("content")
    content_edit = Content.query.filter(Content.id == id).one_or_none()
    if content_edit is not None:
        if content is not None:
            content_edit.content = content
        db.session.commit()
        return ContentSchema().dump(content_edit), 201
    else:
        abort(406, f"Beacon Content with id: {id} not found.")


