import "../styles/postmedia.css"
import {useState} from "react";

interface PostImage {
    url: string
    width: number
    height: number
}

interface PostMediaProps {
    images: PostImage[]
}

// @ts-ignore
const Lightbox: React.FC<{ image: string; onClose: () => void }> = ({ image, onClose }) => {
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
// @ts-ignore
const PostMedia: React.FC<PostMediaProps> = ({ images }) => {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    if (!images || images.length === 0) return null;


    const renderImage = (image: PostImage, index: number) => {
        const aspect = (image.height / image.width) * 100;
        return (
            <div
                key={index}
                className="post-media-item"
                style={{paddingBottom: `${aspect}%`}}
                onClick={() => setLightboxImage(`http://127.0.0.1:8000${image.url}`)}
            >
                <img src={`http://127.0.0.1:8000${image.url}`}
                     alt=""
                     className="post-media-img"
                     loading="lazy"
                     draggable={false}

                />
            </div>
        )
    }

    if (images.length === 1) {
        return (
            <>
                <div className="post-media-single">{renderImage(images[0], 0)}</div>
                {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
            </>
        )

    }

    if (images.length === 2) {
        return (
            <>
                <div className="post-media-grid grid-2">{images.map(renderImage)}</div>
                {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
            </>
        )
    }

    if (images.length === 3) {
        return (
            <>
                <div className="post-media-grid grid-3">
                    {renderImage(images[0], 0)}
                    <div className="post-media-stack">
                        {renderImage(images[1], 1)}
                        {renderImage(images[2], 2)}
                    </div>
                </div>
                {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
            </>
        );
    }

    const visibleImages = images.slice(0, 4);
    const hasMore = images.length > 4;

    return (
        <>
            <div className="post-media-grid grid-2x2">
                {visibleImages.map(renderImage)}
                {hasMore && (
                    <div className="post-media-overlay">
                        <span>+{images.length - 4}</span>
                    </div>
                )}
            </div>
            {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
        </>

    );
}


export default PostMedia