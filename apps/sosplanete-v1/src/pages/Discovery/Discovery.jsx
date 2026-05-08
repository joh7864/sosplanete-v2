import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import "./Discovery.css";

const Discovery = () => {
  const { instanceChoices, finishLogin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (!instanceChoices || instanceChoices.length === 0) {
      navigate("/");
    }
  }, [user, instanceChoices, navigate]);

  if (!instanceChoices || instanceChoices.length === 0) return null;

  const handleSelect = (choice) => {
    const headers = {
      "content-type": "application/json",
      Authorization: "Basic " + user,
    };
    finishLogin(choice.instanceId, choice.schoolName, headers);
    navigate("/");
  };

  return (
    <div className="discovery-container">
      <div className="discovery-card">
        <h1>Choisis ton école</h1>
        <p>Tu es inscrit(e) dans plusieurs établissements. Lequel veux-tu rejoindre aujourd'hui ?</p>
        
        <div className="discovery-choices">
          {instanceChoices.map((choice) => (
            <button 
              key={choice.instanceId} 
              className="discovery-choice-btn"
              onClick={() => handleSelect(choice)}
            >
              <div className="school-icon">🏫</div>
              <div className="school-info">
                <span className="school-name">{choice.schoolName}</span>
                <span className="school-id">Espace #{choice.instanceId}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Discovery;
