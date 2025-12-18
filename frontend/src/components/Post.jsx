import {useState} from "react"
import { observer } from "mobx-react-lite"
import Avatar from "./Avatar"



const Post = () => {
    const [post, setPost] = useState({
        "username": "admin",
        "tag": "@admin",
        "title": "Some title",
        "content": "content text bla bla bla",
        "likes_count": 5,
        "comments_count": 24,
        "reposts_count": 10,
        "is_liked": true
    });
    
    const handleLike = () => {
        setPost(prev => ({
            ...prev,
            is_liked: !prev.is_liked,
            likes_count: prev.is_liked ? prev.likes_count - 1 : prev.likes_count + 1
        }));
    };
    
    
    return (
        <div className="post d-flex gap-3 my-3 py-3 pe-3 w-100 shadow-1">
            <div className="post-sidebar">
                <Avatar username="admin"/>
            </div>
            <div className="w-100">
                <div className="post-header pt-1 justify-content-between d-flex w-100">
                    <div className="d-flex gap-1 align-items-end">
                        <span className="post-username text-bold">
                            {post.username}
                        </span>
                        <span className="post-tag small text-muted" style={{paddingBottom:"1px"}}>
                            {post.tag}
                        </span>
                    </div>
                    <span className="post-time small text-muted">
                        Сейчас
                    </span>
                </div>
                <div className="post-body my-3">
                    <h4>{post.title}</h4>
                    <p>{post.content}</p>
                </div>
                <div className="post-footer ms-auto mt-3">
                    <div className="d-flex justify-content-around align-content-center gap-1">
                        <div className="post-footer-item">
                            <i onClick={handleLike} class={`like-icon bi bi-heart${post.is_liked ? "-fill active-like" : ""} `}></i>
                            <span className="text-muted ps-1">{post.likes_count}</span>

                        </div>
                        <div className="post-footer-item">
                            <i className="icon bi bi-chat"></i>
                            <span className="text-muted ps-1">{post.comments_count}</span>

                        </div>
                        <div className="post-footer-item">
                            <i class="icon bi bi-arrow-repeat"></i>
                            <span className="text-muted ps-1">{post.reposts_count}</span>

                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default observer(Post)