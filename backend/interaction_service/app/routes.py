from flask import Blueprint, request, jsonify
from .models import Like, Comment
from .database import db
from .clients import validate_user, validate_post
import logging

bp = Blueprint('interaction', __name__)
logging.basicConfig(level=logging.INFO)

@bp.route('/likes', methods=['POST'])
def like_post():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json()
    post_id = data.get("post_id")

    if not post_id or not validate_post(post_id):
        return jsonify({"error": "post not found"}), 404

    existing = Like.query.filter_by(
        user_id=user["id"], post_id=post_id
    ).first()

    if existing:
        return jsonify({"error": "already liked"}), 409

    like = Like(user_id=user["id"], post_id=post_id)
    db.session.add(like)
    db.session.commit()

    logging.info(f"Like added user={user['id']} post={post_id}")

    return "", 201

@bp.route('/likes', methods=['DELETE'])
def unlike_post():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    post_id = request.args.get("post_id")
    like = Like.query.filter_by(
        user_id=user["id"], post_id=post_id
    ).first()

    if not like:
        return jsonify({"error": "not liked"}), 404

    db.session.delete(like)
    db.session.commit()

    logging.info(f"Like removed user={user['id']} post={post_id}")

    return "", 204

@bp.route('/comments', methods=['POST'])
def create_comment():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json()
    post_id = data.get("post_id")
    text = data.get("text")

    if not post_id or not validate_post(post_id):
        return jsonify({"error": "post not found"}), 404

    if not text:
        return jsonify({"error": "text required"}), 400

    comment = Comment(
        user_id=user["id"],
        post_id=post_id,
        text=text
    )

    db.session.add(comment)
    db.session.commit()

    logging.info(f"Comment added id={comment.id}")

    return jsonify({
        "id": comment.id,
        "created_at": comment.created_at.isoformat()
    }), 201

@bp.route('/comments', methods=['GET'])
def list_comments():
    post_id = request.args.get("post_id")

    comments = Comment.query.filter_by(
        post_id=post_id,
        is_deleted=False
    ).order_by(Comment.created_at.asc()).all()

    return jsonify([
        {
            "id": c.id,
            "user_id": c.user_id,
            "text": c.text,
            "created_at": c.created_at.isoformat()
        } for c in comments
    ]), 200

@bp.route('/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    comment = Comment.query.get(comment_id)
    if not comment or comment.is_deleted:
        return jsonify({"error": "not found"}), 404

    if comment.user_id != user["id"]:
        return jsonify({"error": "forbidden"}), 403

    comment.is_deleted = True
    db.session.commit()

    logging.info(f"Comment deleted id={comment_id}")

    return "", 204
