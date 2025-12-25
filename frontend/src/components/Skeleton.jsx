
const Skeleton = ({isLoading=false, className, width, height, borderRadius, ...props}) => {
    if (!isLoading) {
        return (
            <>{props.children}</>
        )
    }

    return (
        <div
            className={`placeholder-wave placeholder ${className}`}
            style={{
                width,
                height,
                borderRadius,
                verticalAlign: 'middle',
            }}
        >
        </div>
    )
}

export default Skeleton