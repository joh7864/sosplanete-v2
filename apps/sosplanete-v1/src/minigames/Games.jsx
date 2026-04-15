import React from "react";
import { Link } from "react-router-dom";
import GamesList from "./GamesList";

const Games = () => {
  const imageSize = 200;

  return (
    <div className="game-card-container">
      <div className="game-cards-block">
        <p className="games-titre">Bienvenue dans l'espace mini jeux !</p>

        <div className="game-cards" style={{ marginTop: 20 }}>
          {GamesList?.map((g, index) => (
            <div key={index}>
              {g.published && (
                <Link
                  className="game-card"
                  to={g.url}
                  style={{
                    backgroundImage: `url(${g.image})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain",
                    minWidth: imageSize,
                    minHeight: imageSize,
                  }}
                >
                  <div style={{ position: "relative", bottom: -125, left: 0 }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                      {g.name}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: "1.7rem",
            fontWeight: 600,
            marginTop: 100,
            textAlign: "center",
          }}
        >
          Tente ta chance !
        </p>
      </div>
    </div>
  );
};

export default Games;
