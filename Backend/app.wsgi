import sys
sys.path.insert(0, '/home/ubuntu/IndoorLocalizationWebApp/Backend')

activate_this = '/home/ubuntu/.local/share/virtualenvs/Backend-VxK_aYE8/bin/activate_this.py'
with open(activate_this) as file_:
  exec(file.read(), dict(__file__=activate_this))

from app import app as application