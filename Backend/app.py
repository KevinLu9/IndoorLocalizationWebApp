from flask import render_template, abort
from flask_cors import CORS, cross_origin
import config
import connexion

app = config.connex_app
cors = CORS(app)
# app.config['CORS_HEADERS'] = 'Content-Type'
app.add_api("swagger.yml")


@app.route("/")
def home():
    return render_template("home.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
    # app.run(ssl_context='adhoc', host="0.0.0.0", port="8000", debug=True)

