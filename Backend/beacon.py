from datetime import datetime
from flask import abort
from config import db
from models import Beacon, BeaconSchema


def get_timestamp():
    return datetime.now().strftime(("%Y-%m-%d %H:%M:%S"))


def read():
    beacons = Beacon.query.all()
    return BeaconSchema(many=True).dump(beacons)


def create(request):
    id = request.get("id")
    # name = request.get("name")
    # txPower = request.get("txPower")

    if Beacon.query.filter(Beacon.id == id).one_or_none() is None:
        new_beacon = BeaconSchema().load(request, session=db.session)
        db.session.add(new_beacon)
        db.session.commit()
        return BeaconSchema().dump(new_beacon), 201
    else:
        abort(406, f"Beacon with id: {id} already exists.")

def update(request):
    id = request.get("id")
    x = request.get("x")
    y = request.get("y")
    z = request.get("z")
    txPower = request.get("txPower")
    beacon_edit = Beacon.query.filter(Beacon.id == id).one_or_none()
    if beacon_edit is not None:
        beacon_edit.x = x
        beacon_edit.y = y
        beacon_edit.z = z
        beacon_edit.txPower = txPower
        db.session.commit()
        return BeaconSchema().dump(beacon_edit), 201
    else:
        abort(406, f"Beacon with id: {id} not found.")
