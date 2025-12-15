from .database import db
from datetime import datetime

class Like(db.Model):
    __tablename__ = 'likes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    post_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'post_id'),
    )

class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    post_id = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
