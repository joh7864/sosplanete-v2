import React from "react";
//import fond from "../../assets/scoreequipedesk.svg";
import appcfg from "../../config.json";

function ScoresTeams({ teams, ecole }) {
  return (
    <>
      <div className="panel-container" style={{ width: "33%" }}>
        <div className="panel-content-container">
          <h1 className="titre-cadre ">Equipe</h1>
          <div className="text-cadre">{ecole.name}</div>
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              height: "100%",
              gap: "30px",
            }}
          >
            {teams.map((item) => (
              <li key={item.id}>
                <div className="equipe-container text-team">
                  <img src={appcfg.imgRootUrl + item.icon} />
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
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
