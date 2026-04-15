import React from 'react'
import './Depassement.css'

const DepassementCard = ({icon, text, date, borderColor, backgroundColor}) => {
  return (
    <div className="depassement-card-container" style={{backgroundColor: backgroundColor, border: "2px solid " + borderColor}}>
        <div className="depassement-card-text">
            {text}
        </div>
        <div className="depassement-card-date-container">
            <div className="depassement-card-date-icon"><img src={icon}/></div>
            <div className="depassement-card-date-text"  style={{color: borderColor}}>{date}</div>
        </div>
        
    </div>
  )
}

export default DepassementCard