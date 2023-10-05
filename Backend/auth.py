from datetime import datetime
from flask import abort, jsonify, g
from config import db, auth, app
from models import User, UserSchema
from werkzeug.security import generate_password_hash, check_password_hash


# def register(request):
#     username = request.json.get("username")
#     password = request.json.get("password")
#     # Check for blank requests
#     if username is None or password is None:
#         abort(400)
    
#     # Check for existing users
#     if User.query.filter_by(username = username).first():
#         abort(400)
    
#     user = User(username = username)
#     user.hash_password(password)
#     if username == "admin":
#       user.is_admin = True
#     db.session.add(user)
#     db.session.commit()
#     return (jsonify({'username': user.username}), 201)


@auth.verify_password
def verify_password(username_or_token, password):
    # first try token
    print(f"username_or_token: {username_or_token}, password: {password}")
    user = User.verify_auth_token(username_or_token)
    # then check for username and password pair
    if not user:
      user = User.query.filter_by(username = username_or_token).first()
      if not user or not user.verify_password(password):
        return False
      g.user = user
    return True

@app.route('/api/login')
@auth.login_required
def get_token():
    token = g.user.generate_auth_token(600)
    print(f"token: {token}")
    return jsonify({ "token": token, "duration": 600 })