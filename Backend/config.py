import pathlib
import connexion
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_httpauth import HTTPBasicAuth

basedir = pathlib.Path(__file__).parent.resolve()
connex_app = connexion.App(__name__, specification_dir=basedir)

app = connex_app.app
app.config['SECRET_KEY'] = '447d27f760498e239237600ba54be0ad2c7fbb0dff5218b730e1e4fcfcf47074' # For proper security, store secret key elsewhere.
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{basedir / 'sqlite.db'}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
ma = Marshmallow(app)
auth = HTTPBasicAuth()

# Create initial tables in SQLite
# with app.app_context():
#     db.create_all()