import { Link } from "react-router-dom"


const Avatar = ({username="default", size="sm", url, isLocal=false, ...props}) => {
    const sizeClass = `user-avatar-${size}`;
    if (url) {
        return (
            <div className={sizeClass}>
                <img
                    src={isLocal ? url : `http://127.0.0.1:8000${url}`}
                    alt={`${username} avatar`}
                    loading="lazy"
                    draggable={false}
                    className="user-avatar-img"
                />
            </div>
        )
    }

    return (
            <div className={sizeClass}>
                <div className={`user-avatar-fallback`}>
                    <span className="text-bold">{username.charAt(0).toLocaleUpperCase()}</span>
                </div>
            </div>
    )
}

export default Avatar