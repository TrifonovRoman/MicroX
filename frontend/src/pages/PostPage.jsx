import {observer} from "mobx-react-lite";
import Header from "../components/Header";
import Post from "../components/Post";
import {useContext, useEffect, useState} from "react";
import {Context} from "../index";
import {useNavigate, useParams} from "react-router-dom";
import Comments from "../components/Comments.tsx";
import {useNavigateBack} from "../components/useNavigateBack";

const PostPage = () => {
    const {store} = useContext(Context)
    const [post, setPost] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const { id } = useParams();
    const navigate = useNavigate();
    const goBack = useNavigateBack('/');

    useEffect(() => {
        setIsLoading(true)
        const handlePost = async () => {
            try {
                const response = await store.getPostById(parseInt(id, 10))
                setPost(response)
            } catch (e) {
                console.log("error via fetching post")
            }
            setIsLoading(false)
        }

        handlePost()
    }, [store, id]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center m-5">
                <div className="spinner-border" role="status">
                </div>
            </div>
        )
    }



    return (
        <>
            <Header title="Пост" leftIcon="bi-arrow-left" onClickLeft={goBack}/>
            <div className="main-content-line">
                <Post post={post} setPost={setPost}/>
                <Comments postId={parseInt(id, 10)} setPost={setPost}/>
            </div>
        </>
    )
}

export default observer(PostPage)