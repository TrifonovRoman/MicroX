import {useState} from "react"
import { observer } from "mobx-react-lite"
import Post from "../components/Post"
import Divider from "./Divider"

const PostList = () => {
    const [isLoading, setIsLoading] = useState(false)

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
            <div className="row">


                <Post />
                <Post />
                <Post />
                <Post />
            </div>
        </>
    )
    
}

export default observer(PostList)