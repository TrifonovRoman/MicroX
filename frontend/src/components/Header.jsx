import { observer } from "mobx-react-lite"



const Header = ({leftIcon, title, rightIcon, onClickLeft, onClickRight}) => {
    return (
        <div className="header pb-2 text-center d-flex justify-content-between">
            {leftIcon ? (
                <div className="header-button cursor-pointer" onClick={onClickLeft}>
                    <i className={`bi ${leftIcon}`}></i>
                </div>
            ): (
                <div></div>
            )}
            <h5>{title}</h5>
            {rightIcon ? (
                <div className="header-button cursor-pointer" onClick={onClickRight}>
                    <i className={`bi ${rightIcon}`}></i>
                </div>
            ): (
                <div></div>
            )}
        </div>
    )
}

export default observer(Header)