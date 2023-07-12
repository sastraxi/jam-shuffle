import IconButton from './IconButton'
import './SplashScreen.css'

const SplashScreen = (
    { onDismiss }: { onDismiss: () => void }
) => {
    return (
        <div className="splash-screen">
            <span className="logo">
                <IconButton type="shuffle" size="32px" disabled={true} />
                <h1>Jam Shuffle</h1>
            </span>
            <p>
                Break through creative block.<br/>
                Jam with your friends.
            </p>
            <div className="buttons">
                <IconButton type="github" size="24px" href="https://github.com/sastraxi/jam-shuffle" target="_blank" title="View project on Github" />
                <IconButton type="go" size="24px" onClick={onDismiss} title="Get started" />
            </div>
        </div>
    )   
}

export default SplashScreen
