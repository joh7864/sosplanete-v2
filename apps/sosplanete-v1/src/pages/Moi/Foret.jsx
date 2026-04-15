import tree from '../../assets/arbre.svg';
import './Foret.css';

// ---------------------------------
// Composant d'affichage des arbres
//-----------------------------------
function Foret({ actionsRealisees }) {
	//=============================================================
	// SOUS-COMPOSANT : Arbre
	//=============================================================
	function Arbre({ actionsRealisees }) {
		// Fonction de calcul aléatoire de la taille d'un arbre pour diversifier la forêt
		function random(min, max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		}

		let r = random(10, 15);

		// Render : Rendu HTML du composant
		return (
			<>
				<img src={tree} width={r * 5} height={r * 3} className='arbre-vivant'/>
			</>
		);
	}
	//=============================================================
	// Fin du SOUS-COMPOSANT
	//=============================================================

	// Render : Rendu HTML du composant
	return (
		<>
			<div className="foret-container">
				<div className="arbre-container">
					{actionsRealisees.map((actionRealisee) => (
						<div key={actionRealisee.id} className="arbres">
							{/* j'ai modifié le nom de "arbre" par "abres" car il rentrait en conflit avec une autre propriété css */}
							<Arbre />
						</div>
					))}
				</div>
				<div className="compteur-arbre">{actionsRealisees?.length} action(s)</div>
				<div className="ground"></div>
			</div>
		</>
	);
}

export default Foret;
