from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from werkzeug.utils import secure_filename
from .models import User, RefreshToken
from .database import db
from PIL import Image
from .utils import create_access_token, create_refresh_token, jwt_required, get_jwt_config
import bcrypt
import logging
import jwt
import uuid
import os

bp = Blueprint('user', __name__)
logging.basicConfig(level=logging.INFO)

# POST /register - регистрация
@bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    if not username or not password:
        return jsonify({"error": "Требуется имя пользователя и пароль"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Имя пользователя занято"}), 400

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
        return jsonify({"error": "Требуется имя пользователя и пароль"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "Неверное имя пользователя или пароль"}), 401

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
        max_age=60*60*24*7,
        samesite="Lax",
        secure=False  # True в HTTPS
    )

    return response, 200

@bp.route("/auth/refresh", methods=["POST"])
def refresh():
    JWT_SECRET, JWT_ALGORITHM, ACCESS_EXPIRES, REFRESH_EXPIRES = get_jwt_config()
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return jsonify({"error": "Не аутентифицирован"}), 401

    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError()
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Срок токена обновления истек"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Недействительный токен обновления"}), 401

    token_db = RefreshToken.query.filter_by(
        token=refresh_token,
        revoked=False
    ).first()

    if not token_db:
        return jsonify({"error": "Токен обновления отозван"}), 401

    user = User.query.get(payload["sub"])
    access = create_access_token(user)

    return jsonify({"access_token": access}), 200

# POST /auth/logout
@bp.route("/auth/logout", methods=["POST"])
def logout():
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        token = RefreshToken.query.filter_by(token=refresh_token).first()
        if token:
            token.revoked = True
            db.session.commit()

    response = jsonify({"message": "Вышел из системы"})
    response.delete_cookie("refresh_token")
    return response, 200

# GET /users/me
@bp.route("/users/me", methods=["GET"])
@jwt_required
def get_me():
    user = User.query.get(request.user["sub"])
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "avatar_width": user.avatar_width,
        "avatar_height": user.avatar_height,
        "created_at": user.created_at.isoformat()
    }), 200

# GET /users/{id}
@bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    return jsonify({
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "avatar_width": user.avatar_width,
        "avatar_height": user.avatar_height,
        "created_at": user.created_at.isoformat()
    }), 200

@bp.route("/users/batch", methods=["POST"])
def batch_users():
    data = request.get_json() or {}
    ids = data.get("ids", [])
    users = User.query.filter(User.id.in_(ids)).all()
    return jsonify([{
        "id": u.id,
        "username": u.username,
        "display_name": u.display_name,
        "avatar_url": u.avatar_url,
        "avatar_width": u.avatar_width,
        "avatar_height": u.avatar_height,
    } for u in users])

@bp.route("/users/me", methods=["POST"])
@jwt_required
def update_profile():
    user = User.query.get(request.user["sub"])
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404

    username = request.form.get("username")
    display_name = request.form.get("display_name")

    if username:
        user.username = username

    if display_name:
        user.display_name = display_name

    file = request.files.get("avatar")
    if file and file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in {"png", "jpg", "jpeg", "webp"}:
            return jsonify({"error": "Неверный тип файла"}), 400

        file.seek(0, os.SEEK_END)
        if file.tell() > 2 * 1024 * 1024:
            return jsonify({"error": "Файл слишком большой"}), 400
        file.seek(0)

        filename = f"{uuid.uuid4()}.{ext}"
        MEDIA_ROOT = os.environ.get("MEDIA_ROOT", "/media")
        MEDIA_URL = os.environ.get("MEDIA_URL", "/media")

        avatar_dir = os.path.join(MEDIA_ROOT, "avatars")
        os.makedirs(avatar_dir, exist_ok=True)

        path = os.path.join(avatar_dir, filename)
        file.save(path)

        with Image.open(path) as img:
            width, height = img.size

        user.avatar_url = f"{MEDIA_URL}/avatars/{filename}"
        user.avatar_width = width
        user.avatar_height = height

    db.session.commit()

    return jsonify({
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "avatar_width": user.avatar_width,
        "avatar_height": user.avatar_height,
    }), 200

