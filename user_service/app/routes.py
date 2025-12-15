from flask import Blueprint, request, jsonify
from .models import User, Session
from .database import db
import bcrypt
import uuid
from datetime import datetime, timedelta, timezone
import logging

bp = Blueprint('user', __name__)
logging.basicConfig(level=logging.INFO)

SESSION_DURATION_HOURS = 24

# POST /users - регистрация
@bp.route('/users', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    display_name = data.get('display_name')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "username taken"}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(username=username, display_name=display_name, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_DURATION_HOURS)
    session = Session(token=token, user_id=user.id, expires_at=expires_at)
    db.session.add(session)
    db.session.commit()

    logging.info(f"User created: {username}")
    return jsonify({"id": user.id, "username": username, "display_name": display_name,
                    "created_at": user.created_at.isoformat(), "session_token": token}), 201

# POST /auth/login
@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "invalid credentials"}), 401

    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_DURATION_HOURS)
    session = Session(token=token, user_id=user.id, expires_at=expires_at)
    db.session.add(session)
    db.session.commit()

    logging.info(f"User login: {username}")
    return jsonify({"id": user.id, "username": username, "session_token": token}), 200

# GET /users/me
@bp.route('/users/me', methods=['GET'])
def get_me():
    auth = request.headers.get('Authorization')
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "missing token"}), 401
    token = auth.split(" ")[1]

    session = Session.query.filter_by(token=token, revoked=False).first()
    if not session or session.expires_at < datetime.now(timezone.utc):
        return jsonify({"error": "invalid token"}), 401

    user = User.query.get(session.user_id)
    return jsonify({"id": user.id, "username": user.username,
                    "display_name": user.display_name, "created_at": user.created_at.isoformat()}), 200

# GET /users/{id}
@bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"id": user.id, "username": user.username,
                    "display_name": user.display_name, "created_at": user.created_at.isoformat()}), 200

# POST /auth/logout
@bp.route('/auth/logout', methods=['POST'])
def logout():
    auth = request.headers.get('Authorization')
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "missing token"}), 401
    token = auth.split(" ")[1]

    session = Session.query.filter_by(token=token, revoked=False).first()
    if not session:
        return jsonify({"error": "invalid token"}), 401

    session.revoked = True
    db.session.commit()

    logging.info(f"User logout: {session.user_id}")
    return jsonify({"message": "logged out"}), 200