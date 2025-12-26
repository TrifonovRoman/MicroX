import {Post} from "../models/models";
import {Link, useNavigate} from "react-router-dom";
import Avatar from "./Avatar"
// @ts-ignore
import PostMedia from "./PostMedia.tsx";
import {observer} from "mobx-react-lite";

interface RepostedPostProps {
    post: Post
}

const RepostedPost = ({ post }: RepostedPostProps) => {
    const navigate = useNavigate();
    const formatDateTime = (isoString:string) => {
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

    const handlePostClick = (e) => {

        navigate(`/posts/${post.id}`, {replace:true});
    };

    return (
        <div className="reposted-post cursor-pointer" onClick={handlePostClick}>

            <div className="reposted-post-content px-3 pb-3 pt-2">
                <div className="mb-2">
                    <i className="bi bi-arrow-repeat me-2"></i>
                    <span className="small">Репост</span>
                </div>
                <div className="d-flex gap-2">
                    <div className="pt-2">
                        <Link to={`/profile/${post.author.user_id}`} onClick={(e) => e.stopPropagation()}>
                            <Avatar
                                username={post.author.username}
                                url={post.author.user_avatar}
                                size="sm"
                            />
                        </Link>
                    </div>
                    <div className="w-100">
                        <Link
                            to={`/profile/${post.author.user_id}`}
                            className="text-bold text-color text-decoration-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {post.author.username}
                        </Link>
                        <div className="text-muted small mb-2">
                            {formatDateTime(post.created_at)}
                        </div>
                        <p className="mb-2">{post.text}</p>
                        {post.images && post.images.length > 0 && (
                            <div className="mt-2">
                                <PostMedia images={post.images} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

}

export default observer(RepostedPost);