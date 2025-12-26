from flask import Blueprint, request, jsonify
from collections import defaultdict
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, desc, literal
from PIL import Image
from .database import db
from .models import Post, Like, Comment, PostImage
from .client import validate_user, USER_SERVICE_URL
import logging
import os
import requests


bp = Blueprint('posts', __name__)
logging.basicConfig(level=logging.INFO)

@bp.route('/posts', methods=['POST'])
def create_post():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "Неавторизованный"}), 401

    text = request.form.get("text")
    parent_id = request.form.get("parent_post_id", type=int)
    images = request.files.getlist("images")

    if not text:
        return jsonify({"error": "Требуется текст"}), 400

    if images and len(images) > 10:
        return jsonify({"error": "Разрешено максимум 10 изображений"}), 400

    if parent_id:
        parent = Post.query.get(parent_id)
        if not parent or parent.is_deleted:
            return jsonify({"error": "Родительский пост не найден"}), 404

    post = Post(
        user_id=user["id"],
        text=text,
        parent_post_id=parent_id
    )
    db.session.add(post)
    db.session.flush()

    saved_images = []
    if images:
        MEDIA_ROOT = os.environ.get("MEDIA_ROOT", "/media")
        MEDIA_URL = os.environ.get("MEDIA_URL", "/media")

        post_dir = os.path.join(MEDIA_ROOT, "posts", str(post.id))
        os.makedirs(post_dir, exist_ok=True)

        for i, file in enumerate(images):
            ext = file.filename.rsplit(".", 1)[-1].lower()
            if ext not in {"png", "jpg", "jpeg", "webp"}:
                return jsonify({"error": "Неверный тип изображения"}), 400

            filename = f"{i}.{ext}"
            path = os.path.join(post_dir, filename)
            file.save(path)

            with Image.open(path) as img:
                img_width, img_height = img.size

            public_url = f"{MEDIA_URL}/posts/{post.id}/{filename}"

            img = PostImage(
                post_id=post.id,
                file_path=public_url,
                position=i,
                width=img_width,
                height=img_height
            )
            db.session.add(img)
            saved_images.append({
                "url": public_url,
                "position": i,
                "width": img_width,
                "height": img_height
            })

    db.session.commit()

    logging.info(f"Post created id={post.id} by user={user['id']}")
    return jsonify({
        "id": post.id,
        "user_id": post.user_id,
        "text": post.text,
        "parent_post_id": post.parent_post_id,
        "images": saved_images,
        "created_at": post.created_at.isoformat()
    }), 201

@bp.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    user = validate_user(request.headers.get("Authorization"))
    current_user_id = user["id"] if user else None

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "Пост не найден"}), 404

    parent_ids = []
    if post.parent_post_id:
        parent_ids = [post.parent_post_id]

    reposted_posts_map = {}
    if parent_ids:
        reposted_posts = Post.query.filter(
            Post.id.in_(parent_ids),
            Post.is_deleted == False
        ).all()
        reposted_post_ids = [p.id for p in reposted_posts]

        reposted_images = {}
        if reposted_post_ids:
            images = db.session.query(
                PostImage.post_id,
                PostImage.file_path,
                PostImage.position,
                PostImage.width,
                PostImage.height
            ).filter(PostImage.post_id.in_(reposted_post_ids)).all()
            for img in images:
                reposted_images.setdefault(img[0], []).append({
                    "url": img[1], "position": img[2], "width": img[3], "height": img[4]
                })

        reposted_user_ids = [p.user_id for p in reposted_posts]
        reposted_users = {}
        if reposted_user_ids:
            try:
                r = requests.post(f"{USER_SERVICE_URL}/users/batch", json={"ids": reposted_user_ids}, timeout=2)
                if r.ok:
                    for u in r.json():
                        reposted_users[int(u["id"])] = {
                            "user_id": u["id"],
                            "username": u["username"],
                            "user_avatar": u["avatar_url"],
                            "avatar_width": u["avatar_width"],
                            "avatar_height": u["avatar_height"],
                        }
            except Exception as e:
                logging.error(f"Failed to fetch reposted users: {e}")

        for p in reposted_posts:
            likes = db.session.query(func.count(Like.id)).filter(Like.post_id == p.id).scalar() or 0
            comments = db.session.query(func.count(Comment.id)).filter(Comment.post_id == p.id, Comment.is_deleted == False).scalar() or 0
            reposts = db.session.query(func.count(Post.id)).filter(Post.parent_post_id == p.id, Post.is_deleted == False).scalar() or 0

            reposted_posts_map[p.id] = {
                "id": p.id,
                "author": reposted_users.get(p.user_id),
                "text": p.text,
                "created_at": p.created_at.isoformat(),
                "parent_post_id": p.parent_post_id,
                "counts": {
                    "likes": likes,
                    "comments": comments,
                    "reposts": reposts
                },
                "images": sorted(reposted_images.get(p.id, []), key=lambda x: x["position"]),
                "is_liked": False
            }

    is_liked = False
    if current_user_id:
        like_exists = Like.query.filter_by(
            user_id=current_user_id,
            post_id=post_id
        ).first() is not None
        is_liked = like_exists

    likes = db.session.query(func.count(Like.id)).filter(Like.post_id == post_id).scalar() or 0
    comments = db.session.query(func.count(Comment.id)).filter(Comment.post_id == post_id, Comment.is_deleted == False).scalar() or 0
    reposts = db.session.query(func.count(Post.id)).filter(Post.parent_post_id == post_id, Post.is_deleted == False).scalar() or 0

    images = db.session.query(
        PostImage.file_path,
        PostImage.position,
        PostImage.width,
        PostImage.height
    ).filter(PostImage.post_id == post_id).order_by(PostImage.position).all()

    try:
        r = requests.get(f"{USER_SERVICE_URL}/users/{post.user_id}", timeout=2)
        r.raise_for_status()
        user_info = r.json()
    except Exception as e:
        logging.error(f"Failed to fetch author {post.user_id}: {e}")
        return jsonify({"error": "Не удалось загрузить автора"}), 500

    result = {
        "id": post.id,
        "text": post.text,
        "parent_post_id": post.parent_post_id,
        "reposted_post": reposted_posts_map.get(post.parent_post_id),
        "created_at": post.created_at.isoformat(),
        "is_liked": is_liked,
        "counts": {
            "likes": likes,
            "comments": comments,
            "reposts": reposts
        },
        "images": [
            {"url": path, "position": pos, "width": w, "height": h}
            for path, pos, w, h in images
        ],
        "author": {
            "user_id": post.user_id,
            "username": user_info["username"],
            "user_avatar": user_info["avatar_url"],
            "avatar_width": user_info["avatar_width"],
            "avatar_height": user_info["avatar_height"],
        }
    }

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

    images_sub = db.session.query(
        PostImage.post_id.label("post_id"),
        func.json_agg(
            func.json_build_object(
                "url", PostImage.file_path,
                "position", PostImage.position,
                "width", PostImage.width,
                "height", PostImage.height
            )
        ).label("images")
    ).group_by(PostImage.post_id).subquery()

    # Main query
    q = db.session.query(
        Post,
        func.coalesce(likes_all_sub.c.likes_count, 0).label("likes_count"),
        func.coalesce(comments_count_sub.c.comments_count, 0).label("comments_count"),
        func.coalesce(reposts_count_sub.c.reposts_count, 0).label("reposts_count"),
        func.coalesce(likes_me_sub.c.liked, 0).label("liked_by_me") if likes_me_sub is not None else literal(False).label("liked_by_me"),
        images_sub.c.images
    ).outerjoin(likes_all_sub, likes_all_sub.c.post_id == Post.id
    ).outerjoin(comments_count_sub, comments_count_sub.c.post_id == Post.id
    ).outerjoin(reposts_count_sub, reposts_count_sub.c.post_id == Post.id
    ).outerjoin(images_sub, images_sub.c.post_id == Post.id
    )

    if likes_me_sub is not None:
        q = q.outerjoin(likes_me_sub, likes_me_sub.c.post_id == Post.id)

    q = q.filter(Post.is_deleted == False).order_by(Post.created_at.desc())

    posts = q.all()
    user_ids = list({post.user_id for post, *_ in posts})

    users_by_id = {}

    if user_ids:
        r = requests.post(f"{USER_SERVICE_URL}/users/batch", json={"ids": user_ids}, timeout=3)
        if r.ok:
            for u in r.json():
                users_by_id[int(u["id"])] = {
                    "username": u["username"],
                    "avatar_url": u["avatar_url"],
                    "avatar_width": u["avatar_width"],
                    "avatar_height": u["avatar_height"],
                }

    posts_by_id = {post.id: post for post, *_ in posts}

    result = []
    for post, likes_count, comments_count, reposts_count, liked_by_me, images in posts:
        images_sorted = sorted(images or [], key=lambda x: x["position"]) if images else []
        author = users_by_id.get(post.user_id)

        reposted_post = None
        if post.parent_post_id is not None:
            reposted_db_post = posts_by_id.get(post.parent_post_id)
            if reposted_db_post:
                reposted_post = build_post_dict(
                    reposted_db_post,
                    users_by_id.get(reposted_db_post.user_id),
                    []
                )
        result.append({
            "id": post.id,
            "author": {
                "user_id": post.user_id,
                "username": author["username"] if author else None,
                "user_avatar": author["avatar_url"] if author else None,
                "avatar_width": author["avatar_width"] if author else None,
                "avatar_height": author["avatar_height"] if author else None,
            },
            "text": post.text,
            "created_at": post.created_at.isoformat(),
            "parent_post_id": post.parent_post_id,
            "reposted_post": reposted_post,
            "counts": {
                "likes": likes_count,
                "comments": comments_count,
                "reposts": reposts_count
            },
            "images": images_sorted,
            "is_liked": bool(liked_by_me)
        })

    return jsonify(result), 200

def build_post_dict(post_db, author_dict, images):
    author = None
    if author_dict:
        author = {
            "user_id": post_db.user_id,
            "username": author_dict["username"],
            "user_avatar": author_dict["avatar_url"],
            "avatar_width": author_dict["avatar_width"],
            "avatar_height": author_dict["avatar_height"],
        }

    images_sorted = sorted(images or [], key=lambda x: x["position"]) if images else []
    return {
        "id": post_db.id,
        "author": author,
        "text": post_db.text,
        "created_at": post_db.created_at.isoformat(),
        "parent_post_id": post_db.parent_post_id,
        "counts": {
            "likes": 0,
            "comments": 0,
            "reposts": 0
        },
        "images": images_sorted,
        "is_liked": False
    }

@bp.route('/posts/users/<int:user_id>', methods=['GET'])
def list_user_posts(user_id):
    current_user = validate_user(request.headers.get("Authorization"))
    current_user_id = current_user["id"] if current_user else None

    likes_all_sub = db.session.query(
        Like.post_id.label("post_id"),
        func.count(Like.id).label("likes_count")
    ).group_by(Like.post_id).subquery()

    likes_me_sub = None
    if current_user_id:
        likes_me_sub = db.session.query(
            Like.post_id.label("post_id"),
            func.count(Like.id).label("liked")
        ).filter(Like.user_id == current_user_id).group_by(Like.post_id).subquery()

    comments_count_sub = db.session.query(
        Comment.post_id.label("post_id"),
        func.count(Comment.id).label("comments_count")
    ).filter(Comment.is_deleted == False).group_by(Comment.post_id).subquery()

    reposts_count_sub = db.session.query(
        Post.parent_post_id.label("post_id"),
        func.count(Post.id).label("reposts_count")
    ).filter(Post.is_deleted == False, Post.parent_post_id != None).group_by(Post.parent_post_id).subquery()

    images_sub = db.session.query(
        PostImage.post_id.label("post_id"),
        func.json_agg(
            func.json_build_object(
                "url", PostImage.file_path,
                "position", PostImage.position,
                "width", PostImage.width,
                "height", PostImage.height
            )
        ).label("images")
    ).group_by(PostImage.post_id).subquery()

    q = db.session.query(
        Post,
        func.coalesce(likes_all_sub.c.likes_count, 0).label("likes_count"),
        func.coalesce(comments_count_sub.c.comments_count, 0).label("comments_count"),
        func.coalesce(reposts_count_sub.c.reposts_count, 0).label("reposts_count"),
        func.coalesce(likes_me_sub.c.liked, 0).label("liked_by_me") if likes_me_sub is not None else literal(False).label("liked_by_me"),
        images_sub.c.images
    ).outerjoin(likes_all_sub, likes_all_sub.c.post_id == Post.id
    ).outerjoin(comments_count_sub, comments_count_sub.c.post_id == Post.id
    ).outerjoin(reposts_count_sub, reposts_count_sub.c.post_id == Post.id
    ).outerjoin(images_sub, images_sub.c.post_id == Post.id
    )

    if likes_me_sub is not None:
        q = q.outerjoin(likes_me_sub, likes_me_sub.c.post_id == Post.id)

    q = q.filter(Post.is_deleted == False, Post.user_id == user_id).order_by(Post.created_at.desc())
    posts = q.all()

    author = None
    r = requests.post(f"{USER_SERVICE_URL}/users/batch", json={"ids": [user_id]}, timeout=3)
    if r.ok and r.json():
        u = r.json()[0]
        author = {
            "user_id": u["id"],
            "username": u["username"],
            "user_avatar": u["avatar_url"],
            "avatar_width": u["avatar_width"],
            "avatar_height": u["avatar_height"]
        }

    parent_ids = set()
    for post, *_ in posts:
        if post.parent_post_id is not None:
            parent_ids.add(post.parent_post_id)

    reposted_posts_map = {}
    if parent_ids:
        reposted_posts = Post.query.filter(
            Post.id.in_(parent_ids),
            Post.is_deleted == False
        ).all()
        reposted_post_ids = [p.id for p in reposted_posts]

        reposted_images = {}
        if reposted_post_ids:
            images = db.session.query(
                PostImage.post_id,
                PostImage.file_path,
                PostImage.position,
                PostImage.width,
                PostImage.height
            ).filter(PostImage.post_id.in_(reposted_post_ids)).all()
            for img in images:
                reposted_images.setdefault(img[0], []).append({
                    "url": img[1],
                    "position": img[2],
                    "width": img[3],
                    "height": img[4]
                })

        reposted_user_ids = [p.user_id for p in reposted_posts]
        reposted_users = {}
        if reposted_user_ids:
            r = requests.post(f"{USER_SERVICE_URL}/users/batch", json={"ids": reposted_user_ids}, timeout=2)
            if r.ok:
                for u in r.json():
                    reposted_users[int(u["id"])] = {
                        "user_id": u["id"],
                        "username": u["username"],
                        "user_avatar": u["avatar_url"],
                        "avatar_width": u["avatar_width"],
                        "avatar_height": u["avatar_height"],
                    }

        for p in reposted_posts:
            likes = db.session.query(func.count(Like.id)).filter(Like.post_id == p.id).scalar()
            comments = db.session.query(func.count(Comment.id)).filter(Comment.post_id == p.id, Comment.is_deleted == False).scalar()
            reposts = db.session.query(func.count(Post.id)).filter(Post.parent_post_id == p.id, Post.is_deleted == False).scalar()

            reposted_posts_map[p.id] = {
                "id": p.id,
                "author": reposted_users.get(p.user_id),
                "text": p.text,
                "created_at": p.created_at.isoformat(),
                "parent_post_id": p.parent_post_id,
                "counts": {
                    "likes": likes,
                    "comments": comments,
                    "reposts": reposts
                },
                "images": sorted(reposted_images.get(p.id, []), key=lambda x: x["position"]),
                "is_liked": False
            }

    result = []
    for post, likes_count, comments_count, reposts_count, liked_by_me, images in posts:
        images_sorted = sorted(images or [], key=lambda x: x["position"]) if images else []
        result.append({
            "id": post.id,
            "author": author,
            "text": post.text,
            "created_at": post.created_at.isoformat(),
            "parent_post_id": post.parent_post_id,
            "reposted_post": reposted_posts_map.get(post.parent_post_id),
            "counts": {
                "likes": likes_count,
                "comments": comments_count,
                "reposts": reposts_count
            },
            "images": images_sorted,
            "is_liked": bool(liked_by_me)
        })

    return jsonify(result), 200


@bp.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "Неавторизованный"}), 401

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "Пост не найден"}), 404
    if post.user_id != user["id"]:
        return jsonify({"error": "Удаление запрещено"}), 403

    post.is_deleted = True
    db.session.commit()
    return "", 204

@bp.route('/likes/<int:post_id>', methods=['POST'])
def like_post(post_id):
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "Неавторизованный"}), 401

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "Пост не найден"}), 404

    like = Like(user_id=user["id"], post_id=post_id)
    db.session.add(like)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Лайк уже поставлен"}), 409

    return "", 201

@bp.route('/likes/<int:post_id>', methods=['DELETE'])
def unlike_post(post_id):
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "Неавторизованный"}), 401

    like = Like.query.filter_by(user_id=user["id"], post_id=post_id).first()
    if not like:
        return jsonify({"error": "Лайк не поставлен"}), 404

    db.session.delete(like)
    db.session.commit()
    return "", 204

@bp.route('/comments', methods=['POST'])
def create_comment():
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "Неавторизованный"}), 401

    data = request.get_json() or {}
    post_id = data.get("post_id")
    text = data.get("text")
    if not post_id or not text:
        return jsonify({"error": "post_id и text обязательны"}), 400

    post = Post.query.get(post_id)
    if not post or post.is_deleted:
        return jsonify({"error": "Пост не найден"}), 404

    comment = Comment(user_id=user["id"], post_id=post_id, text=text)
    db.session.add(comment)
    db.session.commit()

    return jsonify({"id": comment.id, "created_at": comment.created_at.isoformat()}), 201

@bp.route('/comments', methods=['GET'])
def list_comments():
    post_id = request.args.get("post_id", type=int)
    if not post_id:
        return jsonify({"error": "Требуется post_id"}), 400

    comments = Comment.query.filter_by(post_id=post_id, is_deleted=False).order_by(Comment.created_at.asc()).all()

    user_ids = list({c.user_id for c in comments})
    users_by_id = {}

    if user_ids:
        r = requests.post(f"{USER_SERVICE_URL}/users/batch", json={"ids": user_ids}, timeout=3)
        if r.ok:
            for u in r.json():
                users_by_id[int(u["id"])] = {
                    "user_id": u["id"],
                    "username": u["username"],
                    "avatar_url": u["avatar_url"],
                    "avatar_width": u["avatar_width"],
                    "avatar_height": u["avatar_height"],
                }

    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "text": c.text,
            "created_at": c.created_at.isoformat(),
            "author": users_by_id.get(c.user_id)
        })

    return jsonify(result), 200

@bp.route('/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    user = validate_user(request.headers.get("Authorization"))
    if not user:
        return jsonify({"error": "Неавторизованный"}), 401

    comment = Comment.query.get(comment_id)
    if not comment or comment.is_deleted:
        return jsonify({"error": "Комментарий не найден"}), 404

    if comment.user_id != user["id"]:
        return jsonify({"error": "Удаление запрещено"}), 403

    comment.is_deleted = True
    db.session.commit()
    return "", 204
