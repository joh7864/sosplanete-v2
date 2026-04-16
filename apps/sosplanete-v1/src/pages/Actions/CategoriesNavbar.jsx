import React, { useEffect, useState } from 'react';
import './CategoriesNavbar.css';
import { useNavigate } from 'react-router-dom';
import arrowleft from '../../assets/arrowleft.svg';
import arrowright from '../../assets/arrowright.svg';
import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import appcfg from '../../config.js';

//----------------------------------------
// Composant de navigation entre les catégories de la pages actions
//----------------------------------------
function CategoriesNavbar({
	categories,
	currentCategorie,
	changeCategorie,
	currentActionsRealisees,
	currentTotalActions,
}) {
	const navigate = useNavigate();
	const [currentCategorieIcon, setCurrentCategorieIcon] = useState('');
	const [currentCategorieName, setCurrentCategorieName] = useState('');

	// Evènement de mount du composant (Mémorisation du chemin de l'icon de la catégorie en cours)
	useEffect(() => {
		var cat = categories.filter((c) => c.id == currentCategorie)[0];
		if (cat) {
			setCurrentCategorieIcon(cat.icon);
			setCurrentCategorieName(cat.name);
		}
	}, [currentCategorie]);

	// Evènement de mount du composant (Mémorisation du chemin de l'icon de la catégorie en cours)
	useEffect(() => {
		var cat = categories.filter((c) => c.id == currentCategorie)[0];
		if (cat) {
			setCurrentCategorieIcon(cat.icon);
			setCurrentCategorieName(cat.name);
		}
	}, []);

	// Navigation mobile
	function prev() {
		const index = categories.findIndex((c) => c.id == currentCategorie);

		if (index <= 0) return categories[categories.length - 1].id;

		return categories[index - 1].id;
	}
	function next() {
		console.log('currentCategorie', currentCategorie);
		const index = categories.findIndex((c) => c.id == currentCategorie);

		if (index == categories.length - 1) return categories[0].id;

		return categories[index + 1].id;
	}

	return (
		<>
			<div className="height-nav">
				{/* j'ai set toutes les propriétés la sur la page Actions.css */}
				<ul className="categories-navbar">
					{categories.map((categorie) => (
						<li
							key={categorie.id}
							className="categories-navbar-container"
							onClick={() => changeCategorie(categorie.id)}
						>
							<div className="categories-navbar-item-container">
								<div>
									<img
										src={appcfg.imgRootUrl + categorie.icon}
										className={
											categorie.id != currentCategorie
												? 'img-disable'
												: undefined
										}
									/>
									<div>
										{categorie.id == currentCategorie ? (
											<>
												<div className="underline">{categorie.name}</div>
												<div className="compteur-actions">
													réalisée(s) {currentActionsRealisees}/
													{currentTotalActions}
												</div>
											</>
										) : (
											<div className="txt-disable">{categorie.name}</div>
										)}
									</div>
								</div>
							</div>
						</li>
					))}
					<div className="nav-tabmob">
						<article className="info-page">
							<div onClick={() => changeCategorie(prev())}>
								<img src={arrowleft} alt="navigation gauche" />
							</div>
							<h3>
								<img src={appcfg.imgRootUrl + currentCategorieIcon} alt="" />
								{currentCategorieName}
							</h3>
							<div onClick={() => changeCategorie(next())}>
								<img src={arrowright} alt="navigation droite" />
							</div>
						</article>
						<article className="data-number">
							<CircularProgressbarWithChildren
								value={currentActionsRealisees}
								maxValue={currentTotalActions}
							>
								{currentActionsRealisees}/{currentTotalActions}
							</CircularProgressbarWithChildren>
						</article>
					</div>
				</ul>
			</div>
		</>
	);
}

export default CategoriesNavbar;
