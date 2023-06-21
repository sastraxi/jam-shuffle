import './Choice.css'

const Choice = ({
    className,
    href,
    target,   
    children,
}: {
    className?: string,
    href?: string,
    target?: string
    children?: React.ReactNode
}) => {
    return (
        <a href={href} target={target} className={`choice balance-text ${className ?? ''}`}>
            {children}
        </a>
    )
}

export default Choice
