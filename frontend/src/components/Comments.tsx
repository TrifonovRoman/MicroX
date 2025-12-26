import {observer} from "mobx-react-lite";
import {useContext, useEffect, useState} from "react";
import {Context} from "../index";
import Avatar from "./Avatar"
import {Comment, Post} from "../models/models";
import "../styles/comments.css"
import Skeleton from "../components/Skeleton";
import { Link } from "react-router-dom";

interface CommentsProps {
    postId: number;
    setPost:any
}

const Comments = ({ postId, setPost }: CommentsProps) => {
    const {store} = useContext(Context)
    const [comments, setComments] = useState<Comment[]>([])
    const [inputVal, setInputVal] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchComments = async () => {
            try {
                console.log(postId)
                const response = await store.getPostComments(postId)
                setComments(response)
            } catch (e) {
                console.log("error via fetching comments")
            } finally {
                setIsLoading(false)

            }
        }

        fetchComments()
    }, [store, postId])

    // @ts-ignore
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = inputVal.trim()

        if (!trimmed) return
        if (trimmed.length > 500) {
            setError("Длина комментария не может быть больше 500")
            return
        }

        setIsSubmitting(true)
        setError("")

        try {
            const newCommentData = await store.createPostComment(postId, trimmed)
            const newComment: Comment = {
                id: newCommentData.id,
                text: trimmed,
                created_at: newCommentData.created_at,
                author: {
                    user_id: store.id || 0,
                    username: store.username || "Вы",
                    avatar_url: store.avatar_url,
                    avatar_width: 0,
                    avatar_height: 0
                },
            };
            setComments((prev) => [...prev, newComment])
            setPost((prevPost: Post) => ({
                ...prevPost,
                counts: {
                    ...prevPost.counts,
                    comments: (prevPost.counts.comments || 0) + 1,
                },
            }));
            setInputVal("");
        } catch (e) {
            console.log("error via fetching comments")
        } finally {
            setIsSubmitting(false)

        }
    }

    // Форматирование даты (например: "2 ч назад")
    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffDay > 0) return `${diffDay} д`;
        if (diffHour > 0) return `${diffHour} ч`;
        if (diffMin > 0) return `${diffMin} мин`;
        return "только что";
    };

    return (

        <div className="comments-section py-2 px-4 w-100">
            {store.isAuth ? (
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="d-flex gap-3">
                        <Avatar username={store.username} url={store.avatar_url} />

                        <div className="flex-grow-1">
                        <textarea
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder="Напишите комментарий..."
                            className="form-control comment-input"
                            rows={2}
                            disabled={isSubmitting}
                        />
                            {error && <div className="text-danger mt-1 small">{error}</div>}
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-2">
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm px-3"
                            disabled={!inputVal.trim() || isSubmitting}
                        >
                            {isSubmitting ? "Отправка..." : "Ответить"}
                        </button>
                    </div>
                </form>
            ): (
                <></>
            )}


            {/* Загрузка */}
            {isLoading ? (
                <div className="d-flex flex-column gap-3 mt-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="d-flex gap-3">
                            <div className="skeleton avatar-skeleton rounded-circle"></div>
                            <div className="flex-grow-1">
                                <div className="skeleton text-skeleton mb-2" style={{ width: '40%' }}></div>
                                <div className="skeleton text-skeleton" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <h5 className="pb-3">Комментарии</h5>
                    {comments.length === 0 ? (
                        <p className="text-muted text-center mt-4">Пока нет комментариев</p>
                    ) : (
                        <div className="comments-list">
                            {comments.map((comment) => (
                                <div key={comment.id} className="comment-item d-flex gap-3 mb-3">
                                    {/* Аватар */}
                                    <Skeleton className="text-left" isLoading={isLoading} width={40}
                                              height={40} borderRadius="50px">
                                        <Link to={`/profile/${comment.author.user_id}`}>
                                            <Avatar username={comment.author.username} url={comment.author.avatar_url} id={comment.author.user_id}/>
                                        </Link>
                                    </Skeleton>

                                    <div className="comment-content flex-grow-1">
                                        <div className="d-flex align-items-baseline gap-2 mb-1">
                                            <Skeleton className="text-left" isLoading={isLoading} width={100}
                                                      height={15} borderRadius="0px">
                                                <span className="fw-bold">{comment.author.username}</span>
                                            </Skeleton>
                                            <Skeleton className="text-left" isLoading={isLoading} width={70}
                                                      height={15} borderRadius="0px">
                                                <span className="text-muted small">{formatTimeAgo(comment.created_at)}</span>
                                            </Skeleton>
                                        </div>
                                        <Skeleton className="text-left" isLoading={isLoading} width={300}
                                                  height={15} borderRadius="0px">
                                            <p className="mb-0">{comment.text}</p>
                                        </Skeleton>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )

}

export default observer(Comments)