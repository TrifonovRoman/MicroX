from .database import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, nullable=False, unique=True)
    display_name = db.Column(db.Text)
    bio = db.Column(db.Text)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class Session(db.Model):
    __tablename__ = 'sessions'
    token = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    expires_at = db.Column(db.DateTime(timezone=True))
    revoked = db.Column(db.Boolean, default=False)
