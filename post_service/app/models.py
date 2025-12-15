from .database import db
from datetime import datetime

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)

    text = db.Column(db.Text, nullable=False)

    parent_post_id = db.Column(db.Integer, nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    is_deleted = db.Column(db.Boolean, default=False)

    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    reposts_count = db.Column(db.Integer, default=0)
