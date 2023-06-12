import './Spinner.css'

const Spinner = ({ size = "18px" }: { size: string}) => (
    <div className="lds-ripple" style={{ width: size, height: size }}>
        <div></div>
        <div></div>
    </div>
)

export default Spinner
