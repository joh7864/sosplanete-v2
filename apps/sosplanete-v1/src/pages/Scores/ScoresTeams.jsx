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
                  {item.icon ? (
                    <img src={appcfg.imgRootUrl + item.icon} alt="" />
                  ) : (
                    <div 
                      className="flex items-center justify-center text-white font-black rounded-xl shrink-0" 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        backgroundColor: item.color || '#40916C',
                        fontSize: '1.1rem'
                      }}
                    >
                      {item.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
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
