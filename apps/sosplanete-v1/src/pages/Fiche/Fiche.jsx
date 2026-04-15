import React, { Suspense, useEffect, useState } from "react";
import { NnauruAPI } from "../../api/nnauruAPI";
import oops from "../../assets/Oops.png";
import icon from "../../assets/logout.svg";
import Header from "../../components/Header";
import Mascotte from "../../components/Mascotte/Mascotte";
import appcfg from "../../config.json";
import { useAuth } from "../../utils/AuthContext";
import Categories from "./Categories";
import "./Fiche.css";

// -----------------------------------
// Page : Cette page affiche la liste des catégories
// Chaque catégorie est affichée par le composant Vignette
// -----------------------------------
const Fiche = () => {
  // Les variables d'affichage

  const [categories, setCategories] = useState([]);
  const [availableWeek, setAvailableWeek] = useState(true);

  const { user, currentWeek } = useAuth();
  const titre = "Bonjour";

  // Mount du composant
  useEffect(() => {
    if (currentWeek === null) return;

    // Vérification de la présence de la période
    if (Object.keys(currentWeek).length === 0) setAvailableWeek(false);
    else setAvailableWeek(true);
  }, [categories]);

  // Mount du composant
  useEffect(() => {
    // Récupération de la liste des catégories via l'API REST
    NnauruAPI.get(user, "/categories", true).then((categoriesItems) => {
      setCategories(categoriesItems);
    });
  }, []);

  // -----------------------------------
  // Render : Rendu HTML du composant
  // -----------------------------------
  return (
    <>
      <Header title="Ma fiche" icon={icon} />

      <div className="container flex justify-center">
        <Suspense fallback={<>chargement en cours !</>}>
          <Mascotte
            mascotteId="MaFiche"
            titre={titre}
            ligne1="Une belle journée s'annonce !"
            ligne2="Tu es prêt à compléter les actions que tu as faites ?"
          >
            <p style={{ marginTop: 15 }}>
              Si tu veux un peu d'aide,{" "}
              <a href={appcfg.maFicheCategorieUrl} target="_blank">
                clique ici
              </a>
            </p>
            {!availableWeek && (
              <>
                <div
                  className="cv"
                  style={{
                    fontSize: "1.5rem",
                    color: "#366878",
                    textAlign: "center",
                    maxWidth: "100%",
                    margin: 10,
                  }}
                >
                  <div style={{ maxWidth: "100%", margin: 10 }}>
                    <img
                      src={oops}
                      style={{
                        display: "block",
                        margin: "0 auto",
                        maxWidth: 400,
                        width: "100%",
                        height: "auto",
                        marginBottom: 20,
                      }}
                    ></img>
                    <div>Pas de semaine active. Contactes ta maîtresse</div>
                    <div>ou ton maitre pour régler le problème.</div>
                    <div>En attendant entraînes-toi aux mini-jeux !</div>
                  </div>
                </div>
              </>
            )}
          </Mascotte>
          <ul className="categories-container">
            <Categories categories={categories} />
          </ul>
        </Suspense>
      </div>
    </>
  );
};

export default Fiche;
