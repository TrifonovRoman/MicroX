from functools import wraps
from flask import request, jsonify, current_app
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

def get_jwt_config():
    return (
        current_app.config["JWT_SECRET"],
        current_app.config["JWT_ALGORITHM"],
        int(current_app.config["ACCESS_EXPIRES"]),
        int(current_app.config["REFRESH_EXPIRES"])
    )

def create_access_token(user):
    JWT_SECRET, JWT_ALGORITHM, ACCESS_EXPIRES, REFRESH_EXPIRES = get_jwt_config()
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "type": "access",
        "iat": datetime.now(tz=timezone.utc),
        "exp": datetime.now(tz=timezone.utc) + timedelta(minutes=ACCESS_EXPIRES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user):
    JWT_SECRET, JWT_ALGORITHM, ACCESS_EXPIRES, REFRESH_EXPIRES = get_jwt_config()
    payload = {
        "sub": str(user.id),
        "type": "refresh",
        "iat": datetime.now(tz=timezone.utc),
        "exp": datetime.now(tz=timezone.utc) + timedelta(days=REFRESH_EXPIRES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def jwt_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        JWT_SECRET, JWT_ALGORITHM, ACCESS_EXPIRES, REFRESH_EXPIRES = get_jwt_config()
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"error": "missing access token"}), 401

        token = auth.split(" ")[1]

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            payload["sub"] = int(payload["sub"])
            if payload.get("type") != "access":
                raise jwt.InvalidTokenError()
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "access token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "invalid access token"}), 401

        return fn(*args, **kwargs)
    return wrapper
