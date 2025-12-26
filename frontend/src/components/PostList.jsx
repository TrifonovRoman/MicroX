import {useContext, useEffect, useState} from "react"
import { observer } from "mobx-react-lite"
import Post from "../components/Post"
import Divider from "./Divider"
import {Context} from "../index";
import {Link} from "react-router-dom";

const PostList = ({isAllPosts=true, userId}) => {
    const [isLoading, setIsLoading] = useState(true)
    const {store} = useContext(Context)
    const [posts, setPosts] = useState([])

    useEffect(() => {
        setIsLoading(true)
        const fetchPosts = async () => {
            try {
                let response;
                if (isAllPosts) {
                    response = await store.getAllPosts()
                } else {
                    response = await store.getUserPosts(userId)
                }
                console.log(response)
                setPosts(response)

            } catch (e) {
                console.error("Failed to fetch posts: ", e)
            }


        }

        fetchPosts()
        setIsLoading(false)
    }, [store]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center m-5">
                <div className="spinner-border" role="status">
                </div>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="d-flex justify-content-center m-5 fs-5 text-muted">
                <span>Здесь пока пусто</span>
            </div>
        )
    }

    return (
        <>
                {posts.map((item) => (
                    <Post key={item.id} post={item} setPosts={setPosts}/>
                ))}
        </>
    )
    
}

export default observer(PostList)