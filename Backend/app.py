from flask import render_template, abort
from flask_cors import CORS, cross_origin
import config
import connexion
from models import User, UserSchema
from config import db

app = config.connex_app
cors = CORS(app.app)
app.add_api("swagger.yml")


@app.route("/")
def home():
    return render_template("home.html")

if __name__ == "__main__":
    with config.app.app_context():
        db.create_all()
        # Create admin account
        if User.query.filter(User.username == 'admin').one_or_none() is None:
            user = User(username='admin')
            user.hash_password('beansarecool')
            db.session.add(user)
            db.session.commit()
    app.run(host="0.0.0.0", port=8000, debug=True)
    # app.run(ssl_context='adhoc', host="0.0.0.0", port="8000", debug=True)

