import { createContext, useState, useEffect, useContext } from "react";
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import './header.css'

const Header = props => {
    const navigate = useNavigate();
    const {user, logoutUser, pseudo} = useAuth();
    const [title, setTitle] = useState(props.title);
    const [icon, setIcon] = useState(props.icon);

    const doAction = () => {
      if(title == "Ma fiche") {
        logoutUser();
      } else  {
        navigate("/");
      }
    }

    useEffect(() => {
    }, [title, icon]);

  return (
    <>
        {user ? (
        <>
          <div className="top-menu-container">
            <div className="top-menu-icon">
                <img src={icon} onClick={doAction}/>
            </div>
            <div className="top-menu-title">
                {title}
            </div>

          </div>

        </>
        ):(
            <div></div>
        )}
            
    </>
  )
}

export default Header
