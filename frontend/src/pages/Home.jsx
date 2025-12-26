import {observer} from "mobx-react-lite"
import Header from "../components/Header"
import PostList from "../components/PostList"

const Home = () => {
    return (
        <>
        <Header title="Главная" />
        <div className="main-content-line">
            <PostList />
        </div>




        </>
    )
}

export default observer(Home)