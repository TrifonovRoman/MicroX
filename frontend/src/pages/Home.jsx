import {observer} from "mobx-react-lite"
import Header from "../components/Header"
import PostList from "../components/PostList"

const Home = () => {
    return (
        <>
        <Header title="Главная" />

        <PostList />



        </>
    )
}

export default observer(Home)