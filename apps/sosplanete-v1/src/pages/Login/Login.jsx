import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import packageJson from "../../../package.json";
import hidePwdImg from "../../assets/hide-password.svg";
import KidLeft from "../../assets/left.svg";
import KidLeftCenter from "../../assets/leftcenter.svg";
import KidRight from "../../assets/right.svg";
import KidRightCenter from "../../assets/rightcenter.svg";
import showPwdImg from "../../assets/show-password.svg";
import Mascotte from "../../components/Mascotte/Mascotte";
import { useAuth } from "../../utils/AuthContext";

import "./Login.css";

const Login = () => {
  const { user, loginUser, errorAuthentification, instanceChoices } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [isRevealPwd, setIsRevealPwd] = useState(false);

  const [isStayConnected, setIsStayConnected] = useState(
    JSON.parse(localStorage.getItem("isStayConnected"))
  );
  const [pseudo, setPseudo] = useState(localStorage.getItem("pseudo"));
  const [password, setPassword] = useState(localStorage.getItem("password"));

  const loginForm = useRef(null);
  const [openModal, setOpenModal] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isLoginButtonDisable, setIsLoginButtonDisable] = useState(null);

  const savedChoicesMap = JSON.parse(localStorage.getItem("sos_instance_choices") || "{}");
  const localChoices = savedChoicesMap[pseudo] || null;
  const displayChoices = instanceChoices || localChoices;
  
  const [selectedInstanceId, setSelectedInstanceId] = useState(localStorage.getItem("sos_last_instance_id") || "");

  const [mascotteTitre, setMascotteTitre] = useState("");
  const [mascotteLigne1, setMascotteLigne1] = useState("");
  const [mascotteLigne2, setMascotteLigne2] = useState("");
  const [mascotteLastUpdate, setMascotteLastUpdate] = useState(Date.now());

  // Controle des caractères spéciaux
  function containsSpecialChars(str) {
    const specialChars = /[`@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return specialChars.test(str);
  }

  // Controle des accents
  function containsAccentsChars(str) {
    const accentsChars = /[éèêëàâäîïôöùûüÿ]/;
    return accentsChars.test(str);
  }

  // -----------------------------------------------------
  // Interception de l'évènement de fermeture de la mascotte
  // -----------------------------------------------------
  const handleMascotteClosed = () => {
    setMascotteTitre("");
    setMascotteLigne1("");
    setMascotteLigne2("");
    var d = Date.now();
    setMascotteLastUpdate(d);
  };
  const handleModaleView = () => {
    setMascotteTitre("Bonjour");
    setMascotteLigne1(
      "Contacte ta maitresse ou ton maître pour récupérer ton pseudo et ton mot de passe, ou fait une demande sur le site à la rubrique Contact."
    );
    setMascotteLigne2("");
    var d = Date.now();
    setMascotteLastUpdate(d);
  };
  const handleMascotteInit = () => {
    setMascotteTitre("Bonjour");
    setMascotteLigne1(
      "Bonjour je suis <b>Gribouille</b> et je suis là pour t’aider. Si tu n’as pas besoin de moi clique sur mon image, et je m’endormirai. Et si je suis endormi, clique à nouveau sur mon image pour me réveiller !<br></br>"
    );
    setMascotteLigne2(
      "Quand je suis réveillé, tu peux aussi cliquer sur la bulle pour la faire disparaître, mais je continuerai à te parler si besoin. <br></br><p>Alors, amuse toi bien &#128578;</p>"
    );
    var d = Date.now();
    setMascotteLastUpdate(d);
  };
  // Controle des accents
  function checks(value, fieldName) {
    setError("");

    if (containsSpecialChars(value)) {
      setError(
        "Ton " +
          fieldName +
          " contient des caractères spéciaux, c'est interdit !"
      );
      return false;
    } else if (containsAccentsChars(value)) {
      setError(
        "Ton " +
          fieldName +
          " contient des caractères accentués, c'est interdit !"
      );
      return false;
    }

    return true;
  }

  // Vérification des champs input
  const checkInputField = (e, updateField, fieldName) => {
    e.preventDefault();
    updateField(e.target.value);

    if (checks(e.target.value, fieldName) == true) {
      fieldName === "pseudo"
        ? checks(password, "mot de passe")
        : checks(pseudo, "pseudo");
    }
  };

  // Click dans la case à cocher de persistance
  const checkStayConnectedHandler = () => {
    setIsStayConnected(!isStayConnected);
  };

  // Click sur le bouton de connexion
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Effacement des infos de connexions le cas échéant
    if (JSON.parse(localStorage.getItem("isStayConnected")) === false) {
      localStorage.setItem("pseudo", "");
      localStorage.setItem("password", "");
    } else {
      localStorage.setItem("pseudo", pseudo);
      localStorage.setItem("password", password);
    }

    setError("");
    const userInfo = { pseudo, password };

    if (displayChoices && displayChoices.length > 1 && !selectedInstanceId) {
      setError("Veuillez choisir un établissement dans la liste déroulante.");
      return;
    }

    // On ne passe l'instance au backend QUE si la combo box était affichée et que l'utilisateur a pu la voir
    const finalInstanceId = (displayChoices && displayChoices.length > 1) ? selectedInstanceId : null;

    loginUser(userInfo, finalInstanceId);
  };

  // Champ password et pseudo
  useEffect(() => {
    // Inactivation du bouton de connexion si un des champs oblogatoire est manquant
    if (pseudo !== "" && password !== "") setIsLoginButtonDisable("");
    else setIsLoginButtonDisable("disable");
  }, [pseudo, password]);

  // Champ password et pseudo
  useEffect(() => {
    // Persistance de  l'état de conservation des données de connexion
    localStorage.setItem("isStayConnected", isStayConnected);
  }, [isStayConnected]);

  // Effets sur l'affichage, si le user est renseigné c'est que l'on est identifié
  // On navigue vers la page principale
  // Dans le cas contraire, on met à jour le champ expliquant l'erreur
  useEffect(() => {
    // Pour Chrome en mode production
    if (!isStayConnected) {
      setPseudo("");
      setPassword("");
    }
    if (user) {
      // La mascotte est rendue active par défaut
      localStorage.setItem("mascotte", "on");
      navigate("/");
    } else setError(errorAuthentification);

    handleMascotteInit();
  }, []);

  return (
    <>
      <div className="login-page-container">
        <div className="login-container">
          <form onSubmit={handleSubmit} ref={loginForm}>
            <div className="form-field-wrapper">
              <input
                required
                autoComplete="off"
                type="text"
                name="pseudo"
                placeholder="Pseudo..."
                onChange={(e) => checkInputField(e, setPseudo, "pseudo")}
                value={pseudo}
              />
            </div>

            <div className="form-field-wrapper">
              <div className="pwd-container">
                <input
                  required
                  type={isRevealPwd ? "text" : "password"}
                  name="password"
                  placeholder="Mot de passe..."
                  onChange={(e) =>
                    checkInputField(e, setPassword, "mot de passe")
                  }
                  value={password}
                />
                <img
                  title={
                    isRevealPwd
                      ? "Cacher le mot de passe"
                      : "Voir le mot de passe"
                  }
                  src={isRevealPwd ? hidePwdImg : showPwdImg}
                  onClick={() => setIsRevealPwd((prevState) => !prevState)}
                />
              </div>
            </div>

            <div className="error-message">{error}</div>

            <div className="form-field-wrapper login-options-wrapper">
              <div className="stay-connected-group">
                <input
                  id="chkStayConnected"
                  type="checkbox"
                  checked={isStayConnected}
                  onChange={checkStayConnectedHandler}
                />
                <label htmlFor="chkStayConnected">Restez connecté</label>
              </div>

              {displayChoices && displayChoices.length > 1 && (
                <div className="school-combo-wrapper" title="Choisissez votre établissement">
                  <span className="school-combo-icon">🏫</span>
                  <select 
                    value={selectedInstanceId} 
                    onChange={(e) => setSelectedInstanceId(e.target.value)}
                    className="school-combo-box"
                  >
                    {!selectedInstanceId && <option value="" disabled>Choisissez...</option>}
                    {displayChoices.map(choice => (
                      <option key={choice.instanceId} value={choice.instanceId}>
                        {choice.schoolName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-field-wrapper">
              <input
                disabled={isLoginButtonDisable}
                type="submit"
                value="Connexion"
                className="btn"
              />
            </div>

            <Link
              className="header--link center-text"
              onClick={() => handleModaleView()}
            >
              Mot de passe perdu ?
            </Link>
          </form>
          <div className="login-version">
            {packageJson.name} Version {packageJson.version}
          </div>
        </div>

        <Mascotte
          mascotteId="Login-accueil"
          titre={mascotteTitre}
          ligne1={mascotteLigne1}
          ligne2={mascotteLigne2}
          onClosed={handleMascotteClosed}
        >
          <p>
            Si tu veux plus d'information sur SOS Plan&egrave;te&nbsp;
            <a href="https://sosplanete.fr/" target="_blank">
              clique ici
            </a>
          </p>
        </Mascotte>
        <div className="kids-container">
          <img src={KidLeft} />
          <img src={KidLeftCenter} />
          <img src={KidRightCenter} />
          <img src={KidRight} />
        </div>
      </div>
    </>
  );
};

export default Login;
