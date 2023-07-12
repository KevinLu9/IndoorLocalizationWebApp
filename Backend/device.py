from datetime import datetime

def get_timestamp():
    return datetime.now().strftime(("%Y-%m-%d %H:%M:%S"))


def read():
    data = {
    "device1": {
        "RSSI": [1,2,3,4,5],
        "timestamp": get_timestamp(),
        },
    "device2": {
        "RSSI": [6,7,8,9,10,11],
        "timestamp": get_timestamp(),
        },
    "device3": {
        "RSSI": [11,12,13],
        "timestamp": get_timestamp(),
        }
    }
    return list(data.values())