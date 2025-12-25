import {useContext, useState} from "react"
import { observer } from "mobx-react-lite"
import Avatar from "./Avatar"
import {Context} from "../index";
import PostMedia from "./PostMedia.tsx";
import {Link, useNavigate} from "react-router-dom";



const Post = ({post, setPosts, setPost}) => {
    const {store} = useContext(Context)
    const navigate = useNavigate()
    // const [post, setPost] = useState({
    //     "username": "admin",
    //     "tag": "@admin",
    //     "title": "Some title",
    //     "content": "content text bla bla bla",
    //     "likes_count": 5,
    //     "comments_count": 24,
    //     "reposts_count": 10,
    //     "is_liked": true
    // });


    function formatDateTime(isoString) {
        const date = new Date(isoString);

        if (isNaN(date.getTime())) {
            return '—';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() возвращает 0–11
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    const handleLike = async (e) => {
        e.stopPropagation()
        try {
            if (post.is_liked) {
                await store.unlikePost(post.id)
            } else {
                await store.likePost(post.id)
            }
            handleLikeView()
        } catch (e) {
            console.log("error via like")
        }
    }

    const handleRepostClick = (e) => {
        e.stopPropagation();

    }
    
    const handleLikeView = () => {
        if (setPost) {
            setPost(prev => ({
                ...prev,
                is_liked: !prev.is_liked,
                counts: {
                    ...prev.counts,
                    likes: prev.is_liked ? prev.counts.likes - 1 : prev.counts.likes + 1
                }
            }));
            return;
        }

        // Иначе — обновляем список
        if (setPosts) {
            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p.id === post.id
                        ? {
                            ...p,
                            is_liked: !p.is_liked,
                            counts: {
                                ...p.counts,
                                likes: p.is_liked ? p.counts.likes - 1 : p.counts.likes + 1
                            }
                        }
                        : p
                )
            );
        }

    };

    const handlePostClick = (e) => {
        e.stopPropagation();
        navigate(`/posts/${post.id}`);
    };

    const handleMediaClick = (e) => {
        e.stopPropagation();
    };
    
    
    return (
        <div className="post d-flex py-2 px-4 w-100" onClick={handlePostClick}>
            <div className="post-sidebar pt-2">
                <Link to={`/profile/${post.author.user_id}`} onClick={(e) => e.stopPropagation()}>
                    <Avatar username={post.author.username} id={post.author.user_id} url={post.author.user_avatar}/>
                </Link>
            </div>
            <div className="w-100 ps-2">
                <div className="post-header justify-content-between d-flex w-100">
                    <div className="d-flex gap-1 align-items-center">
                        <Link
                            className="post-username text-bold text-color"
                            to={`/profile/${post.author.user_id}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {post.author.username}
                        </Link>
                        {/*<span className="post-tag small text-muted m-0">*/}
                        {/*    {post.author.username}*/}
                        {/*</span>*/}
                    </div>
                    <span className="post-time small text-muted">
                        {formatDateTime(post.created_at)}
                    </span>
                </div>
                <div className="post-body me-3">
                    <p>{post.text}</p>
                    <div onClick={handleMediaClick}>
                        <PostMedia images={post.images} />
                    </div>

                </div>
                <div className="post-footer mt-3">
                    <div className="d-flex align-content-center gap-4">
                        <div className="post-footer-item" onClick={handleLike}>
                            <i className={`like-icon bi bi-heart${post.is_liked ? "-fill active-like" : ""} `}></i>
                            {post.counts.likes === 0 ? (
                                <span className="text-muted ps-1 d-none">0</span>
                            ): (
                                <span className="text-muted ps-1">{post.counts.likes}</span>
                            )}

                        </div>
                        <div className="post-footer-item">
                            <i className="icon bi bi-chat"></i>
                            {post.counts.comments === 0 ? (
                                <span className="text-muted ps-1 d-none">0</span>
                            ): (
                                <span className="text-muted ps-1">{post.counts.comments}</span>
                            )}


                        </div>
                        <div className="post-footer-item">
                            <i className="icon bi bi-arrow-repeat"></i>
                            {post.counts.reposts === 0 ? (
                                <span className="text-muted ps-1 d-none">0</span>
                            ): (
                                <span className="text-muted ps-1">{post.counts.reposts}</span>
                            )}


                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default observer(Post)