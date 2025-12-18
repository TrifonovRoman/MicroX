from flask import Blueprint, request, jsonify
from .models import Post
from .database import db
from .client import validate_token
import logging

bp = Blueprint('posts', __name__)
logging.basicConfig(level=logging.INFO)

@bp.route('/posts', methods=['POST'])
def create_post():
    user = validate_token(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json()
    text = data.get("text")
    parent_id = data.get("parent_post_id")

    if not text:
        return jsonify({"error": "text required"}), 400

    if parent_id:
        parent = Post.query.get(parent_id)
        if not parent or parent.is_deleted:
            return jsonify({"error": "parent post not found"}), 404
        parent.reposts_count += 1

    post = Post(
        user_id=user["id"],
        text=text,
        parent_post_id=parent_id
    )

    db.session.add(post)
    db.session.commit()

    logging.info(f"Post created id={post.id} by user={user['id']}")

    return jsonify({
        "id": post.id,
        "user_id": post.user_id,
        "text": post.text,
        "parent_post_id": post.parent_post_id,
        "created_at": post.created_at.isoformat()
    }), 201

@bp.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "not found"}), 404

    result = {
        "id": post.id,
        "user_id": post.user_id,
        "text": post.text,
        "parent_post_id": post.parent_post_id,
        "created_at": post.created_at.isoformat()
    }

    if request.args.get("expand") == "counts":
        result["counts"] = {
            "likes": post.likes_count,
            "comments": post.comments_count,
            "reposts": post.reposts_count
        }

    return jsonify(result), 200

@bp.route('/posts', methods=['GET'])
def list_posts():
    limit = int(request.args.get("limit", 50))
    user_id = request.args.get("user_id")

    q = Post.query.filter_by(is_deleted=False)

    if user_id:
        q = q.filter_by(user_id=user_id)

    posts = q.order_by(Post.created_at.desc()).limit(limit).all()

    return jsonify([
        {
            "id": p.id,
            "user_id": p.user_id,
            "text": p.text,
            "created_at": p.created_at.isoformat(),
            "counts": {
                "likes": p.likes_count,
                "comments": p.comments_count,
                "reposts": p.reposts_count
            }
        } for p in posts
    ]), 200

@bp.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    user = validate_token(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "not found"}), 404

    if post.user_id != user["id"]:
        return jsonify({"error": "forbidden"}), 403

    post.is_deleted = True
    db.session.commit()

    logging.info(f"Post deleted id={post_id}")

    return "", 204

@bp.route('/posts/aggregate', methods=['GET'])
def aggregate():
    limit = int(request.args.get("limit", 50))
    sort_by = request.args.get("sort_by", "score")

    score = (
        Post.likes_count * 2 +
        Post.comments_count +
        Post.reposts_count * 3
    )

    q = Post.query.filter_by(is_deleted=False)

    if sort_by == "likes":
        q = q.order_by(Post.likes_count.desc())
    elif sort_by == "comments":
        q = q.order_by(Post.comments_count.desc())
    elif sort_by == "reposts":
        q = q.order_by(Post.reposts_count.desc())
    else:
        q = q.order_by(score.desc())

    posts = q.limit(limit).all()

    return jsonify([
        {
            "id": p.id,
            "user_id": p.user_id,
            "text": p.text,
            "created_at": p.created_at.isoformat(),
            "counts": {
                "likes": p.likes_count,
                "comments": p.comments_count,
                "reposts": p.reposts_count
            }
        } for p in posts
    ]), 200
