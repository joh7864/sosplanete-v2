import { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import { useAuth } from '../utils/AuthContext';

import logout from '../assets/logout.svg';

import Cogs from './Icons/Cogs'
import Fiche from './Icons/Fiche'
import Impacts from './Icons/Impact'
import Moi from './Icons/Moi'
import Scores from './Icons/Scores'
import Games from './Icons/GamePad'
import Book from './Icons/Book'

const NavBar = () => {
	const { user, logoutUser, pseudo, currentWeek, activeSchoolName, instanceChoices, school, isDelegate, allowAllDelegate } = useAuth();
	const [showNavbar, setShowNavbar] = useState(false);
	const [navbarItemSelected, setNavbarItemSelected] = useState("/fiche");

	// Selection du menuItem
	const handleMenuSelected = (url) => {
		setNavbarItemSelected(url);
	};

	// Composant MENU-ITEM
	const NavBarMenu = ({ title, icon, url, navbarItemSelected }) => {
		return (
			<>
				<div>
					<Link to={url} className={navbarItemSelected === url ? "header--link active" : "header--link"}>
						<div className="item-menu-img-container"> 
							<img src={icon} />
						</div>
						<div className="item-menu-container">{title}</div>
					</Link>
				</div> 
			</>
		);
	};

	return (
		<>
			{user ? (
				<nav className="nav-footer">
					<div className={`nav-items  ${showNavbar && 'active'}`}>
						<div className="quitter-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							<div className='btn-quitter' onClick={() => logoutUser()} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer'}}>
								<NavBarMenu title="Quitter" icon={logout}/>
							</div>
						</div>
						
						<div onClick={() => handleMenuSelected("/fiche")}>
							<Link to="/fiche" className={navbarItemSelected === "/fiche" ? "header--link active" : "header--link"}>
								<div className="item-menu-img-container"> 
									<Fiche fillColor={navbarItemSelected === "/fiche" ? "var(--bg-color)" : "#000000"} />
								</div>
								<div className="item-menu-container">Ma fiche</div>
							</Link>
						</div>

						{(currentWeek !== undefined && currentWeek !== null && Object.keys(currentWeek).length > 0) &&
						<>
						<div onClick={() => handleMenuSelected("/moi")}>
							<Link to="/moi" className={navbarItemSelected === "/moi" ? "header--link active" : "header--link"}>
								<div className="item-menu-img-container"> 
									<Moi fillColor={navbarItemSelected === "/moi" ? "var(--bg-color)" : "#000000"} />
								</div>
								<div className="item-menu-container">Moi</div>
							</Link>
						</div>  

						<div onClick={() => handleMenuSelected("/scores")}>
							<Link to="/scores" className={navbarItemSelected === "/scores" ? "header--link active" : "header--link"}>
								<div className="item-menu-img-container"> 
									<Scores fillColor={navbarItemSelected === "/scores" ? "var(--bg-color)" : "#000000"} />
								</div>
								<div className="item-menu-container">Scores</div>
							</Link>
						</div>  
						
						
						<div onClick={() => handleMenuSelected("/impacts")}>
							<Link to="/impacts" className={navbarItemSelected === "/impacts" ? "header--link active" : "header--link"}>
								<div className="item-menu-img-container"> 
									<Impacts fillColor={navbarItemSelected === "/impacts" ? "var(--bg-color)" : "#000000"} />
								</div>
								<div className="item-menu-container">Impacts</div>
							</Link>
						</div>  
						</>

						}

						<div onClick={() => handleMenuSelected("/sosstory")}>
							<Link to="/sosstory" className={navbarItemSelected === "/sosstory" ? "header--link active" : "header--link"}>
								<div className="item-menu-img-container"> 
									<Book fillColor={navbarItemSelected === "/sosstory" ? "var(--bg-color)" : "#000000"} />
								</div>
								<div className="item-menu-container">Histoire</div>
							</Link>
						</div> 	

						<div onClick={() => handleMenuSelected("/games")}>
							<Link to="/games" className={navbarItemSelected === "/games" ? "header--link active" : "header--link"}>
								<div className="item-menu-img-container"> 
									<Games fillColor={navbarItemSelected === "/games" ? "var(--bg-color)" : "#000000"} />
								</div>
								<div className="item-menu-container">Jeux</div>
							</Link>
						</div> 

						{(isDelegate || allowAllDelegate) && (
						<>
							<div className="separator" style={{ width: '2px', height: '30px', backgroundColor: '#e2e8f0', margin: '0 10px', borderRadius: '2px' }} />
							<div onClick={() => handleMenuSelected("/dashboard")}>
								<Link to="/dashboard" className={navbarItemSelected === "/dashboard" ? "header--link active" : "header--link"}>
									<div className="item-menu-img-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}> 
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={navbarItemSelected === "/dashboard" ? "var(--bg-color)" : "#000000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="2" y1="12" x2="22" y2="12"></line>
											<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
										</svg>
									</div>
									<div className="item-menu-container">Mission Planète</div>
								</Link>
							</div>
						</>
						)}

						
						{
							// Menu spécial pédro
							pseudo == 'pierre' && (

								<div onClick={() => handleMenuSelected("/profile")}>
								<Link to="/profile" className={navbarItemSelected === "/profile" ? "header--link active" : "header--link"}>
									<div className="item-menu-img-container"> 
										<Cogs fillColor={navbarItemSelected === "/profile" ? "var(--bg-color)" : "#000000"} />
									</div>
									<div className="item-menu-container">Dev</div>
								</Link>
							</div> 

							)
						}
					</div>
				</nav>
			) : (
				<></>
			)}
		</>
	);
};

export default NavBar;
