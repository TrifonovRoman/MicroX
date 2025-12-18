import { Link } from "react-router-dom"


const Avatar = ({username="default", id=0, size="sm", ...props}) => {
    return (
        <Link to={`/profile/${id}`} className="text-decoration-none">
            <div {...props} className={"user-avatar-" + size}>
                <div className="user-avatar-inner shadow ">
                    <span className="text-bold">{username.charAt(0).toLocaleUpperCase()}</span>
                </div>
            </div>
        </Link>
    )
}

export default Avatar