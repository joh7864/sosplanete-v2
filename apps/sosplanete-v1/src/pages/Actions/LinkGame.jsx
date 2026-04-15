import React from 'react'
import { Link } from 'react-router-dom';
import etoile from '../../minigames/images/etoile.svg'

function LinkGame({...props}) {

  const style = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    width: "100%"
  }

  return (
    <>
      <div style={style}>
        <img src={etoile} />
        <Link to={props?.url} className="header--link active">
              <div>{props?.title}</div>
          </Link>
      </div>

    </>
  )
}

export default LinkGame