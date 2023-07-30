from datetime import datetime
from flask import abort
from config import db
from models import Device, DeviceSchema


def get_timestamp():
    return datetime.now().strftime(("%Y-%m-%d %H:%M:%S"))


def read():
    devices = Device.query.all()
    return DeviceSchema(many=True).dump(devices)


def create(device):
    id = device.get("id")
    name = device.get("name")
    txPower = device.get("txPower")

    if Device.query.filter(Device.id == id).one_or_none() is None:
        new_device = DeviceSchema().load(device, session=db.session)
        db.session.add(new_device)
        db.session.commit()
        return DeviceSchema().dump(new_device), 201
    else:
        abort(406, f"Device with {id} already exists.")

