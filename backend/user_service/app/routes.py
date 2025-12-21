from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from werkzeug.utils import secure_filename
from .models import User, RefreshToken
from .database import db
from .utils import create_access_token, create_refresh_token, jwt_required, get_jwt_config
import bcrypt
import logging
import jwt
import uuid
import os

bp = Blueprint('user', __name__)
logging.basicConfig(level=logging.INFO)

# POST /users - регистрация
@bp.route("/users", methods=["POST"])
def register():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "username taken"}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(username=username, password_hash=password_hash)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "id": user.id,
        "username": user.username
    }), 201

# POST /auth/login
@bp.route("/auth/login", methods=["POST"])
def login():
    JWT_SECRET, JWT_ALGORITHM, ACCESS_EXPIRES, REFRESH_EXPIRES = get_jwt_config()
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "invalid credentials"}), 401

    access = create_access_token(user)
    refresh = create_refresh_token(user)

    rt = RefreshToken(
        token=refresh,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRES)
    )
    db.session.add(rt)
    db.session.commit()

    response = jsonify({
        "access_token": access,
        "avatar_url": user.avatar_url
    })

    response.set_cookie(
        "refresh_token",
        refresh,
        httponly=True,
        samesite="Strict",
        secure=False  # True в HTTPS
    )

    return response, 200

@bp.route("/auth/refresh", methods=["POST"])
def refresh():
    JWT_SECRET, JWT_ALGORITHM, ACCESS_EXPIRES, REFRESH_EXPIRES = get_jwt_config()
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return jsonify({"error": "not authenticated"}), 401

    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError()
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "refresh expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "invalid refresh"}), 401

    token_db = RefreshToken.query.filter_by(
        token=refresh_token,
        revoked=False
    ).first()

    if not token_db:
        return jsonify({"error": "refresh revoked"}), 401

    user = User.query.get(payload["sub"])
    access = create_access_token(user)

    return jsonify({"access_token": access}), 200

# GET /users/me
@bp.route("/users/me", methods=["GET"])
@jwt_required
def get_me():
    user = User.query.get(request.user["sub"])
    if not user:
        return jsonify({"error": "user not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "bio": user.bio,
        "avatar_url": user.avatar_url
    }), 200

# GET /users/{id}
@bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"id": user.id, "username": user.username,
                    "display_name": user.display_name, "created_at": user.created_at.isoformat()}), 200

# POST /auth/logout
@bp.route("/auth/logout", methods=["POST"])
def logout():
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        token = RefreshToken.query.filter_by(token=refresh_token).first()
        if token:
            token.revoked = True
            db.session.commit()

    response = jsonify({"message": "logged out"})
    response.delete_cookie("refresh_token")
    return response, 200

@bp.route("/users/me/avatar", methods=["POST"])
@jwt_required
def upload_avatar():
    if "file" not in request.files:
        return jsonify({"error": "file required"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "empty filename"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "webp"}:
        return jsonify({"error": "invalid file type"}), 400

    file.seek(0, os.SEEK_END)
    if file.tell() > 2 * 1024 * 1024:
        return jsonify({"error": "file too large"}), 400
    file.seek(0)

    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join("uploads/avatars", filename)
    os.makedirs("uploads/avatars", exist_ok=True)
    file.save(path)

    user = User.query.get(request.user["sub"])
    user.avatar_url = f"/static/avatars/{filename}"
    db.session.commit()

    return jsonify({"avatar_url": user.avatar_url}), 200
