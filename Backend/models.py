from datetime import datetime
from config import db, ma
from flask_sqlalchemy import SQLAlchemy


class Device(db.Model):
    __tablename__ = "device"
    id = db.Column(db.String(32), primary_key=True)
    name = db.Column(db.String(32))
    txPower = db.Column(db.Integer)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
class DeviceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Device
        load_instance = True
        sqla_session = db.session

class Beacon(db.Model):
    __tablename__ = "beacon"
    id = db.Column(db.String(32), primary_key=True)
    name = db.Column(db.String(32))
    txPower = db.Column(db.Integer)
    x = db.Column(db.Float)
    y = db.Column(db.Float)
    z = db.Column(db.Float)
    content = db.Column(db.String())
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
class BeaconSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Beacon
        load_instance = True
        sqla_session = db.session

class Location(db.Model):
    __tablename__ = "location"
    id = db.Column(db.String(32), primary_key=True)
    index = db.Column(db.Integer, primary_key=True)
    x = db.Column(db.Float)
    y = db.Column(db.Float)
    rssi = db.Column(db.Float)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
class LocationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Location
        load_instance = True
        sqla_session = db.session
