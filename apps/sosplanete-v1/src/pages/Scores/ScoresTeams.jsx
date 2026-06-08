import React from "react";
import appcfg from "../../config.js";

function ScoresTeams({ teams, ecole }) {
  if (!teams || !Array.isArray(teams)) return null;
  return (
    <>
      <div className="panel-container panel-equipes">
        <div className="panel-content-container">
          <h1 className="titre-cadre">Equipe</h1>
          <div className="text-cadre">{ecole.name}</div>
          <ul className="teams-list">
            {teams.map((item) => (
              <li key={item.id} className="team-item">
                <div className="equipe-container text-team">
                  <img src={appcfg.imgRootUrl + item.icon} alt="" />
                  <div className="team-name-text">
                    {item.name}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default ScoresTeams;
