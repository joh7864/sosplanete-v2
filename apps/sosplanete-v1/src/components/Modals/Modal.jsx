import React from 'react'
import './Modal.css'

function Modal({modalState, title, message}) {
  return (
    <div className="modalBackground">

        <div className="modalContainer">

            <div className="titleCloseBtn">
            <   button onClick={() => modalState(false)}>X</button>
            </div>

            <div className="title">
                <h1>{title}</h1>
            </div>
            <div className="body">
                <p>
                {message}
                </p>
            </div>
            <div className="footer">
                <button onClick={() => modalState(false)}>Ok</button>
            </div>

        </div>
        
    </div>
  )
}

export default Modal