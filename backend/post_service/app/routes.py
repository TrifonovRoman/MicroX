from flask import Blueprint, request, jsonify
from .database import db
from .models import Post, Like, Comment
from .client import validate_user
from sqlalchemy import func, desc
import logging
from sqlalchemy.exc import IntegrityError

bp = Blueprint('posts', __name__)
logging.basicConfig(level=logging.INFO)

@bp.route('/posts', methods=['POST'])
def create_post():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json() or {}
    text = data.get("text")
    parent_id = data.get("parent_post_id")

    if not text:
        return jsonify({"error": "text required"}), 400

    if parent_id:
        parent = Post.query.get(parent_id)
        if not parent or parent.is_deleted:
            return jsonify({"error": "parent not found"}), 404

    post = Post(user_id=user["id"], text=text, parent_post_id=parent_id)
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

    likes = db.session.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar()
    comments = db.session.query(func.count(Comment.id)).filter(Comment.post_id == post_id, Comment.is_deleted == False).scalar()
    reposts = db.session.query(func.count(Post.id)).filter(Post.parent_post_id == post_id, Post.is_deleted == False).scalar()

    result = {
        "id": post.id,
        "user_id": post.user_id,
        "text": post.text,
        "parent_post_id": post.parent_post_id,
        "created_at": post.created_at.isoformat(),
        "counts": {
            "likes": likes,
            "comments": comments,
            "reposts": reposts
        }
    }

    if request.args.get("expand") == "author":
        from .client import USER_SERVICE_URL
        try:
            r = requests.get(f"{USER_SERVICE_URL}/users/{post.user_id}", timeout=2)
            if r.ok:
                result["author"] = r.json()
        except:
            pass

    return jsonify(result), 200

@bp.route('/posts', methods=['GET'])
def list_posts():
    user = validate_user(request.headers.get("Authorization"))
    user_id = user["id"] if user else None

    # Likes
    likes_all_sub = db.session.query(
        Like.post_id.label("post_id"),
        func.count(Like.id).label("likes_count")
    ).group_by(Like.post_id).subquery()

    likes_me_sub = None
    if user_id:
        likes_me_sub = db.session.query(
            Like.post_id.label("post_id"),
            func.count(Like.id).label("liked")
        ).filter(Like.user_id == user_id).group_by(Like.post_id).subquery()

    # Comments
    comments_count_sub = db.session.query(
        Comment.post_id.label("post_id"),
        func.count(Comment.id).label("comments_count")
    ).filter(Comment.is_deleted==False).group_by(Comment.post_id).subquery()

    # Reposts
    reposts_count_sub = db.session.query(
        Post.parent_post_id.label("post_id"),
        func.count(Post.id).label("reposts_count")
    ).filter(Post.is_deleted==False, Post.parent_post_id!=None).group_by(Post.parent_post_id).subquery()

    # Main query
    q = db.session.query(
        Post,
        func.coalesce(likes_all_sub.c.likes_count, 0).label("likes_count"),
        func.coalesce(comments_count_sub.c.comments_count, 0).label("comments_count"),
        func.coalesce(reposts_count_sub.c.reposts_count, 0).label("reposts_count"),
        func.coalesce(likes_me_sub.c.liked, 0).label("liked_by_me") if likes_me_sub is not None else literal(False).label("liked_by_me")
    ).outerjoin(likes_all_sub, likes_all_sub.c.post_id == Post.id
    ).outerjoin(comments_count_sub, comments_count_sub.c.post_id == Post.id
    ).outerjoin(reposts_count_sub, reposts_count_sub.c.post_id == Post.id
    )

    if likes_me_sub is not None:
        q = q.outerjoin(likes_me_sub, likes_me_sub.c.post_id == Post.id)

    q = q.filter(Post.is_deleted == False).order_by(Post.created_at.desc())

    posts = q.all()

    return jsonify([
        {
            "id": post.id,
            "text": post.text,
            "counts": {
                "likes": likes_count,
                "comments": comments_count,
                "reposts": reposts_count
            },
            "liked_by_me": bool(liked_by_me)
        }
        for post, likes_count, comments_count, reposts_count, liked_by_me in posts
    ]), 200

@bp.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "not found"}), 404
    if post.user_id != user["id"]:
        return jsonify({"error": "forbidden"}), 403

    post.is_deleted = True
    db.session.commit()
    return "", 204

@bp.route('/likes', methods=['POST'])
def like_post():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json() or {}
    post_id = data.get("post_id")
    if not post_id:
        return jsonify({"error": "post_id required"}), 400

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "post not found"}), 404

    like = Like(user_id=user["id"], post_id=post_id)
    db.session.add(like)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "already liked"}), 409 

    return "", 201

@bp.route('/likes', methods=['DELETE'])
def unlike_post():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    post_id = request.args.get("post_id")
    if not post_id:
        return jsonify({"error": "post_id required"}), 400

    like = Like.query.filter_by(user_id=user["id"], post_id=post_id).first()
    if not like:
        return jsonify({"error": "not liked"}), 404

    db.session.delete(like)
    db.session.commit()

    return "", 204

@bp.route('/comments', methods=['POST'])
def create_comment():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json() or {}
    post_id = data.get("post_id")
    text = data.get("text")
    if not post_id or not text:
        return jsonify({"error": "post_id and text required"}), 400

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "post not found"}), 404

    comment = Comment(user_id=user["id"], post_id=post_id, text=text)
    db.session.add(comment)
    db.session.commit()

    return jsonify({"id": comment.id, "created_at": comment.created_at.isoformat()}), 201

@bp.route('/comments', methods=['GET'])
def list_comments():
    post_id = request.args.get("post_id")
    if not post_id:
        return jsonify({"error": "post_id required"}), 400

    comments = Comment.query.filter_by(post_id=post_id, is_deleted=False).order_by(Comment.created_at.asc()).all()

    return jsonify([{"id": c.id, "user_id": c.user_id, "text": c.text, "created_at": c.created_at.isoformat()} for c in comments]), 200

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
    return "", 204
