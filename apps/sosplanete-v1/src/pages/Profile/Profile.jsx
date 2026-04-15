import React, { useEffect, useState } from "react";
import { useAuth } from '../../utils/AuthContext'
import './Profile.css'
import Header from '../../components/Header';
import cogIcon from '../../assets/cog.svg';
import useBreakpoints from '../../hooks/useBreakpoints'

const Profile = () => {

  const {user, pseudo, childId, currentWeek, childInfos, teams, actions} = useAuth()
  const [infos, setInfos] = useState(null);
  const breakPoint = useBreakpoints();

    // Binding de l'affichage
    useEffect(() => {

      setInfos(teams?.filter((team) => team.id == childInfos.team_id)[0]);
      
    }, []);

  return (
    <>
      <Header title="Mon profil" icon={cogIcon} />

      <div className="profile-container">

        <div>Type de device : {breakPoint?.screen} compris entre ({breakPoint?.min} et {breakPoint?.max})</div>

        <div className="infos">
          <h1>Contexte</h1>
            <p>Token  : {user}</p>
            <p>Pseudo : {pseudo}</p>
            <p>Id     : {childId}</p>
        </div>

        <div className="infos">
          <p>Mon équipe  : {childInfos.team_id}</p>
          <p>Mon groupe  : {infos?.group_id}</p>
          <p>Ma couleur  : {infos?.color}</p>
          <p>Le nom de mon équipe  : {infos?.name}</p>
          <img src={infos?.icon} />
        </div>

        <div className="infos">
          <p>Semaine     : {JSON.stringify(currentWeek)}</p>
          <p>Infos     : {JSON.stringify(childInfos)}</p>
        </div>


        <div className="infos">
          <p>Les équipes</p>
          <ul>
            {teams?.map((item) => (
            
            <li key={item.id}>
              <div className="tableau-cadre-gauche">
                <img src={item.icon} />
                <div>{item.id}</div>
                <div>{item.name}</div>
              </div>
            </li>
          ))}            
          </ul>
        </div>

        <div className="infos">
          <p>Les actions</p>
          <ul>
            {actions?.map((item) => (
            
            <li key={item.id}>{item.id} - {item.name}</li>
          ))}            
          </ul>
        </div>

      </div>
    </>

  )
}

export default Profile
