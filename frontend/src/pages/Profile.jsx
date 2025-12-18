import { observer } from "mobx-react-lite"
import Avatar from "../components/Avatar"
import Divider from "../components/Divider"
import PostList from "../components/PostList"


const Profile = () => {
    return (
        <div className="container">
            <div class="profile-avatar-container d-flex justify-content-center">
                <div>
                    <Avatar username="admin" size="md"/>
                </div>
            </div>

            <div className="profile-info">
                <h2 className="profile-name text-center mb-0 text-bold">Алексей Иванов</h2>
                <div className="profile-username text-center text-muted">@alex.ivanov</div>
                <div className="profile-bio mt-3 mb-4 text-center text-muted">
                    Разработчик полного стека с 8-летним опытом. Специализируюсь на React, Node.js и облачных технологиях. 
                    Люблю открытый исходный код, путешествия и хороший кофе. Автор блога о веб-разработке.
                </div>
                <Divider />
                <div className="profile-stats row mb-3 mt-4">
                    <div className="stat-item col-3 d-flex flex-column text-center">
                        <span className="stat-number text-bold fs-4">127</span>
                        <span className="stat-label">Постов</span>
                    </div>
                    <div className="stat-item col-3 d-flex flex-column text-center">
                        <span className="stat-number text-bold fs-4">5.2K</span>
                        <span className="stat-label small">Подписчиков</span>
                    </div>
                    <div className="stat-item col-3 d-flex flex-column text-center">
                        <span className="stat-number text-bold fs-4">892</span>
                        <span className="stat-label small">Подписок</span>
                    </div>
                    <div className="stat-item col-3 d-flex flex-column text-center">
                        <span className="stat-number text-bold fs-4">43</span>
                        <span className="stat-label small">Репортов</span>
                    </div>
                </div>

                <div className="mt-5">
                    <h2>Список постов</h2>
                    <PostList />
                </div>
            </div>
        </div>
    )
}

export default observer(Profile)