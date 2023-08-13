from datetime import datetime
from flask import abort
from config import db
from models import Beacon, BeaconSchema


def get_timestamp():
    return datetime.now().strftime(("%Y-%m-%d %H:%M:%S"))


def read():
    beacons = Beacon.query.all()
    return BeaconSchema(many=True).dump(beacons)


def create(beacon):
    id = beacon.get("id")
    name = beacon.get("name")
    txPower = beacon.get("txPower")

    if Beacon.query.filter(Beacon.id == id).one_or_none() is None:
        new_beacon = BeaconSchema().load(beacon, session=db.session)
        db.session.add(new_beacon)
        db.session.commit()
        return BeaconSchema().dump(new_beacon), 201
    else:
        abort(406, f"Beacon with id: {id} already exists.")

def update(beacon):
    id = beacon.get("id")
    x = beacon.get("x")
    y = beacon.get("y")
    beacon_edit = Beacon.query.filter(Beacon.id == id).one_or_none()
    if beacon_edit is not None:
        beacon_edit.x = x
        beacon_edit.y = y
        db.session.commit()
        return BeaconSchema().dump(beacon_edit), 201
    else:
        abort(406, f"Beacon with id: {id} not found.")
