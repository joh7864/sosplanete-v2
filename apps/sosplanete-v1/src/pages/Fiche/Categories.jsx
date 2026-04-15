import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Categorie from './Categorie';
import ZoomIn from '../../components/animations/ZoomIn/ZoomIn';
import SlideIn from '../../components/animations/Slides/SlideIn/SlideIn';

import './Categories.css';

// -----------------------------------
// Le composant Vignette avec ces propriété
// id : l'id de la catégorie
// name : le nom de la catégorie
// img : le chmin vers l'image de la catégorie
// count : le nombre d'actions réalisées de la catégorie
// -----------------------------------
function Categories({ categories }) {

	// Pour pouvoir utiliser la navigation
	const navigate = useNavigate();

	// handleClick : fonction pour accéder à la liste des actions de la catégorie clickée
	const handleClick = (event, categorieId) => {
		navigate('/actions/' + categorieId);
	};

	// Evènement de MOUNT du composant (Appel API)
	useEffect(() => {

	}, []);


	// -----------------------------------
	// Render : Rendu HTML du composant
	// -----------------------------------
	return (
		<>
			{categories.map((categorie, index) => (
				<li
					key={categorie.id}
					onClick={(event) => handleClick(event, categorie.id)}
				>
					<SlideIn direction={(index % 2 == 0) ? "right" : "left"} speed=".3s">
						<ZoomIn>
							<Categorie categorie={categorie}/>
						</ZoomIn>
					</SlideIn>

				</li>
			))}
		</>
	);
}

export default Categories;
