import React from 'react'
import './ModalInfo.css'

function ModalInfo({modalState, title, message}) {
  return (
    <div className="modalBackground">

        <div className="modalContainer">

            <div className="title">
                <h1>{title}</h1>
            </div>
            <div className="body">
                <p>
                {message}
                </p>
            </div>
            <div className="footer">
            </div>

        </div>
        
    </div>
  )
}

export default ModalInfo