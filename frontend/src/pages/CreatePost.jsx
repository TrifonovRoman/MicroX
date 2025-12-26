import {observer} from "mobx-react-lite";
import Header from "../components/Header";
import React, {useContext, useEffect, useRef, useState} from "react";
import {Context} from "../index";
import {useNavigate, useSearchParams} from "react-router-dom";
import RepostedPost from "../components/RepostedPost.tsx";


const CreatePost = () => {
    const [images, setImages] = useState([]);
    const [subPost, setSubPost] = useState(null);
    const fileInputRef = useRef(null);
    const [text, setText] = useState("")
    const {store} = useContext(Context)
    const [error, setError] = useState("")
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const repostId = searchParams.get("repostId");

    useEffect(() => {

        const handlePost = async () => {
            setIsLoading(true)
            try {
                const response = await store.getPostById(parseInt(repostId, 10))
                setSubPost(response)
            } catch (e) {
                console.log("error via fetching post")
            }
            setIsLoading(false)
        }
        if (repostId) {
            handlePost()
        }
        else {
            setIsLoading(false)
        }
    }, [store, repostId])

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || [])
        const newImages = [...images, ...files].slice(0, 4)
        setImages(newImages);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index))
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handlePublishPost = async () => {
        setError("")
        if (text.length > 500) {
            setError("Длина поста превышает 500 символов")
            return
        }
        if (text.length <= 2) {
            setError("Длина поста слишком маленькая!")
            return
        }
        const formData = new FormData()
        formData.append("text", text)
        if (repostId) {
            formData.append("parent_post_id", repostId)
        }
        images.forEach(file => formData.append("images", file));

        try {
            const response = await store.createPost(formData)
            setText("")
            setImages([])
            navigate(`/posts/${response.id}`)
        } catch (e) {
            console.log("error via creation post")
        }

    }

    const visibleImages = images.slice(0, 3);
    const hiddenCount = images.length - 3;
    return (
        <>
            <Header title="Новый пост" />
            <div className="main-content-line">
                <div>
          <textarea
              name=""
              id=""
              className="w-100 post-input-area p-3 mb-1"
              value={text}
              onChange={(event) => {
                  setText(event.target.value)
              }}
              placeholder="Напишите что-нибудь"
          ></textarea>
                    <span className="text-danger ps-3">{error}</span>
                </div>
                {isLoading ? (
                    <div className="d-flex justify-content-center m-5">
                        <div className="spinner-border" role="status">
                        </div>
                    </div>
                ): (
                    <>
                        {subPost && (
                            <div className="px-3 pb-3"><RepostedPost post={subPost}/></div>
                        )}
                    </>
                )}
                {images.length > 0 && (
                    <div className="p-3">
                        <div className="d-flex gap-2 flex-wrap">
                            {visibleImages.map((file, index) => (
                                <div
                                    key={index}
                                    className="position-relative image-preview overflow-hidden"
                                    style={{ width: '60px', height: '60px' }}
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt=""
                                        className="w-100 h-100 object-cover rounded-3"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-white position-absolute top-0 end-0 mx-1 p-0 shadow-sm"

                                        onClick={() => removeImage(index)}
                                    >
                                        <i className="bi bi-x fs-6"></i>
                                    </button>
                                </div>
                            ))}

                            {hiddenCount > 0 && (
                                <div
                                    className="d-flex align-items-center justify-content-center text-white rounded-3"
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(0,0,0,0.5)',
                                    }}
                                >
                                    +{hiddenCount}
                                </div>
                            )}
                        </div>
                    </div>
                )}



                <div className="px-3 pb-3 mt-2 d-flex mx-2 justify-content-between">
                    <div className="post-footer-item cursor-pointer" onClick={triggerFileInput}>
                        <i className="bi bi-image"></i>
                    </div>
                    <div className="post-footer-item" onClick={handlePublishPost}>
                        <a className="cursor-pointer text-color"><span className="text-bold fs-6">Опубликовать <i className="bi bi-arrow-right-short"></i></span></a>
                    </div>
                </div>


                <input
                    className="d-none"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    multiple
                />
            </div>


        </>
    );
}

export default observer(CreatePost)