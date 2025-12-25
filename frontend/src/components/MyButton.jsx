

const MyButton = ({children, btnType, isLoading=false, ...props}) => {
    if (isLoading) {
        return (
            <button {...props} className={`btn btn-${btnType} disabled d-flex justify-content-center`}>
                {children}
                <h5 className="ps-2 m-0"><span className="spinner-border spinner-border-sm text-light" role="status"
                                               aria-hidden="true"></span></h5>
            </button>
        )
    } else {
        return (
            <button {...props} className={`btn btn-${btnType}`}>
                {children}
            </button>
        )
    }
}

export default MyButton