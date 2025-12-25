import { observer } from "mobx-react-lite";
import { useContext, useState, useEffect, useRef } from "react";
import { Context } from "../index";
import Header from "../components/Header";
import Avatar from "../components/Avatar";
import MyButton from "../components/MyButton";
import {useNavigate} from "react-router-dom";

const EditProfile = () => {
    const { store } = useContext(Context);

    const navigate = useNavigate()
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (store.isAuth) {
            setUsername(store.username || "");
            setDisplayName(store.display_name || store.username || "");
            if (store.avatar_url) {
                setAvatarPreview(`http://127.0.0.1:8000${store.avatar_url}`);
            }
        }
    }, [store.isAuth, store.username, store.display_name, store.avatar_url]);

    // @ts-ignore
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("Пожалуйста, выберите изображение");
                return;
            }

            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setError("");
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // @ts-ignore
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (username.trim().length < 4) {
            setError("Имя пользователя должно содержать не менее 4 символов");
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append("username", username.trim());
        formData.append("display_name", displayName.trim());

        if (avatarFile) {
            formData.append("avatar", avatarFile);
        }

        try {
            await store.editUserProfile(formData);
            navigate(`/profile/${store.id}`)
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                err?.message ||
                "Не удалось обновить профиль"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // @ts-ignore
    return (
        <>
            <Header title="Редактировать профиль" />
            <div className="auth p-4 main-content-line">
                <div className="auth-form">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group my-4 text-center">
                            <div
                                className="mb-3"
                                style={{ cursor: 'pointer' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar
                                    username={username || store.username || "User"}
                                    url={avatarPreview || store.avatar_url}
                                    isLocal={avatarPreview ? 1 : 0}
                                    size="md"
                                />
                            </div>
                            <div className="d-flex justify-content-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Выбрать фото
                                </button>
                                {(avatarPreview || store.avatar_url) && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={handleRemoveAvatar}
                                    >
                                        Удалить
                                    </button>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="form-group my-4">
                            <label className="form-label text-start d-block">Имя пользователя</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Имя пользователя"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group my-4">
                            <label className="form-label text-start d-block">Отображаемое имя</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Как вас зовут"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        {error && <div className="text-danger text-center my-3">{error}</div>}

                        <MyButton
                            type="submit"
                            btnType="primary mt-3 w-100"
                            isLoading={isLoading ? 1 : 0}
                            disabled={isLoading}
                        >
                            {isLoading ? "Сохранение..." : "Сохранить"}
                        </MyButton>
                    </form>
                </div>
            </div>
        </>
    );
};

export default observer(EditProfile);