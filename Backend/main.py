from flask import render_template, abort
import config
import connexion

app = config.connex_app
app.add_api("swagger.yml")


@app.route("/")
def home():
    return render_template("home.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
