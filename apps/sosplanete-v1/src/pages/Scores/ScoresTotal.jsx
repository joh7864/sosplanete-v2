import React, { useEffect, useState } from "react";
import { PieChart } from "react-minimal-pie-chart";
import { NnauruAPI } from "../../api/nnauruAPI";
//import fond from "../../assets/scorecarddesk.svg";

import "../../components/Tabs/Tabs.css";
import appcfg from "../../config.js";
import useBreakpoints from "../../hooks/useBreakpoints";
import { useAuth } from "../../utils/AuthContext";

const ScoresTotal = () => {
  const { user, currentWeek } = useAuth();
  const [scores, setScores] = useState([]);
  const [teams, setTeams] = useState([]);
  const [totalActions, setTotalActions] = useState(0);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [chartData, setChartData] = useState([]);

  const breakPoint = useBreakpoints();

  // Recherche de la couleur de l'équipe
  function getTeamColor(teamId) {
    var c = teams.filter((t) => t.id == teamId)[0]?.color;
    return c;
  }

  // Changement d'état de teams
  useEffect(() => {
    const total = scores.reduce(
      (total, { count_total }) => total + count_total,
      0
    );
    setTotalActions(total);
  }, [chartData]);

  // Changement d'état des scores
  useEffect(() => {
    var arr = [];
    scores.map((item) => {
      let serie = {
        title: item.id,
        value: item.count_total,
        color: getTeamColor(item.id),
      };

      arr.push(serie);
    });

    setChartData(arr);
  }, [scores]);

  // Mount du composant
  useEffect(() => {
    // Appel de l'API pour récupérer les équipes
    NnauruAPI.get(user, "/teams", true).then((result) => {
      setTeams(result);
    });

    // Appel de l'API pour récupérer les scores depuis le début du jeu
    //NnauruAPI.get(user, "/teams/total?week_id=" + currentWeek.id, true).then((result) => {
    NnauruAPI.get(user, "/teams/total?week_id=" + currentWeek.id, true).then(
      (result) => {
        setScores(result);
      }
    );

    var d1 = new Date(currentWeek.begin);
    var d2 = new Date(currentWeek.end);
    setStart(d1.toLocaleDateString("fr-FR"));
    setEnd(d2.toLocaleDateString("fr-FR"));
  }, []);

  return (
    <>
      <div className="panel-container">
        <div className="panel-content-container">
          <h1 className="titre-cadre" style={{ textAlign: "start" }}>
            Score total
          </h1>
          <div className="text-cadre">
            Depuis le début du jeu, vous avez tous ensemble réalisé{" "}
            <strong>{totalActions}</strong> actions.
          </div>
          <div className="total-container">
            <PieChart
              data={chartData}
              label={({ dataEntry }) => dataEntry.value}
              labelStyle={{
                fontSize: "0.4rem",
                fontWeight: 700,
              }}
            />
          </div>

          {/* Affichage des icones des équipes en mode mobile*/}
          {(breakPoint.isMobile || breakPoint.isTablet) && (
            <div className="total-mobile-teams">
              {teams.map((item) => (
                <li key={item.id}>
                  <div className="cv" style={{ gap: 0 }}>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                      }}
                    >
                      {item.name}
                    </div>
                    <img src={appcfg.imgRootUrl + item.icon} />
                  </div>
                </li>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ScoresTotal;
