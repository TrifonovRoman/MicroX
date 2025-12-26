import { observer } from "mobx-react-lite"
import Avatar from "../components/Avatar"
import Divider from "../components/Divider"
import PostList from "../components/PostList"
import {useContext, useEffect, useState} from "react";
import {Context} from "../index";
import {useNavigate, useParams} from "react-router-dom";
import Skeleton from "../components/Skeleton";
import Header from "../components/Header";
import {useNavigateBack} from "../components/useNavigateBack";

const Lightbox = ({ image, onClose }) => {
    return (
        <div className="post-lightbox-overlay w-100 h-100" onClick={onClose}>
            <div className="post-lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={image} alt="Full size" className="post-lightbox-img" />
                <button className="post-lightbox-close" onClick={onClose}>
                    <i className="bi bi-x"></i>
                </button>
            </div>
        </div>
    );
};

const Profile = () => {
    const {store} = useContext(Context)
    const { id } = useParams();
    const [info, setInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);
    const [avatarLightbox, setAvatarLightbox] = useState(null);
    const goBack = useNavigateBack('/');
    const navigate = useNavigate()

    useEffect(() => {
        const fetchProfileInfo = async () => {
            setIsLoading(true)
            setIsNotFound(false)
            try {
                if (id < 0) {
                    setIsNotFound(true)
                }
                const response = await store.getProfileInfo(parseInt(id, 10))
                setInfo(response)
            } catch (e) {
                setIsNotFound(true)
                console.error("Failed to fetch user profile: ", e)
            }

            setIsLoading(false)
        }

        fetchProfileInfo()
    }, [store.id]);

    const editProfileHandler = () => {
        navigate("/profile/edit", {replace: true})
    }


    if (isNotFound) {
        return (
            <div className="text-center">
                <Header leftIcon="bi-arrow-left" onClickLeft={goBack} title="Ошибка 404"/>
                <span>Профиль не найден</span>
            </div>
        )
    }

    const avatarUrl = info?.avatar_url ? `http://127.0.0.1:8000${info.avatar_url}` : null;

    return (
        <>
            <Header leftIcon="bi-arrow-left" onClickLeft={goBack} title={info?.username || "Профиль"} rightIcon="bi-pen" onClickRight={editProfileHandler}/>
            <div className="main-content-line">
                <div className="d-flex row pt-4 px-4">
                    <div className="profile-info left d-flex flex-column col-6 pt-3">
                        <Skeleton className="text-left mb-0 mt-2" isLoading={isLoading} width={150} height={30}>
                            <h3 className="profile-name mb-0 text-bold">{info?.username}</h3>
                        </Skeleton>

                        <Skeleton className="mt-3 mb-4" isLoading={isLoading} width="40vh" height={20}>
                            <div className="profile-bio mt-3 mb-4">
                                {info?.bio || "Пока ничего не написано"}
                            </div>
                        </Skeleton>
                    </div>

                    <div className="profile-avatar-container d-flex justify-content-end col-6">
                        <div onClick={() => avatarUrl && setAvatarLightbox(avatarUrl)}>
                            <Skeleton isLoading={isLoading} width={80} height={80} borderRadius="50px">
                                <Avatar username={info?.username} size="md" url={info?.avatar_url}/>
                            </Skeleton>
                        </div>
                    </div>
                </div>
                <hr className="w-100 my-0 mx-auto"/>
                <div>
                    <h5 className="py-4 ps-4">Посты</h5>
                    <PostList userId={id} isAllPosts={0}/>
                </div>
                {avatarLightbox && (
                    <Lightbox image={avatarLightbox} onClose={() => setAvatarLightbox(null)} />
                )}
            </div>
        </>

    )
}

export default observer(Profile)