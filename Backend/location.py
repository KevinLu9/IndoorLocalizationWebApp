from datetime import datetime
from flask import abort
from config import db
from models import Location, LocationSchema


def get_timestamp():
    return datetime.now().strftime(("%Y-%m-%d %H:%M:%S"))


def read(request):
    search_from_date = datetime(request.datetime_search)
    locations = Location.query.filter_by(id = request.id).filter(Location.created_at >= search_from_date).all()
    return LocationSchema(many=True).dump(locations)


def create(request):
    # id = location.get("id")
    # x = location.get("x")
    # y = location.get("y")
    # rssi = location.get("rssi")
    new_location = LocationSchema().load(request, session=db.session)
    db.session.add(new_location)
    db.session.commit()
    return LocationSchema().dump(new_location), 201

