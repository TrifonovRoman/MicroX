import { observer } from "mobx-react-lite"



const Header = ({title}) => {
    return (
        <div className="header pb-2">
            <h2>{title}</h2>
        </div>
    )
}

export default observer(Header)