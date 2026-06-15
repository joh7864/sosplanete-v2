import React, { useState, useEffect } from 'react';
import { Hexagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const { loginUser, errorAuthentification, instanceChoices, user } = useAuth();
  const navigate = useNavigate();

  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [keepLogged, setKeepLogged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirection automatique si déjà loggé (et qu'on n'est pas dans l'étape des choix)
  useEffect(() => {
    if (user && !instanceChoices) {
      navigate('/');
    }
  }, [user, instanceChoices, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo || !password) return;
    setIsSubmitting(true);
    await loginUser({ pseudo, password, keepLogged });
    setIsSubmitting(false);
  };

  const handleChoice = async (instanceId: string) => {
    setIsSubmitting(true);
    await loginUser({ pseudo, password, keepLogged }, instanceId);
    setIsSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-header">
          <Hexagon className="icon-neon" size={48} />
          <h1>EVOE 2026</h1>
        </div>

        {errorAuthentification && (
          <div className="error-message">{errorAuthentification}</div>
        )}

        {instanceChoices ? (
          <div className="choice-list">
            <p style={{ color: '#fff', textAlign: 'center', margin: '0 0 10px 0' }}>Multiples espaces détectés. Choisissez votre Nexus :</p>
            {instanceChoices.map((choice) => (
              <button 
                key={choice.instanceId} 
                className="choice-btn"
                onClick={() => handleChoice(choice.instanceId)}
                disabled={isSubmitting}
              >
                {choice.schoolName || `Instance #${choice.instanceId}`}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Identifiant de Synchronisation</label>
              <input 
                type="text" 
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ex: dinosaure"
              />
            </div>

            <div className="form-group">
              <label>Clé de Décryptage</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
              />
            </div>

            <label className="checkbox-group">
              <input 
                type="checkbox" 
                checked={keepLogged}
                onChange={(e) => setKeepLogged(e.target.checked)}
              />
              Maintenir la connexion quantique
            </label>

            <button 
              type="submit" 
              className="btn-login"
              disabled={isSubmitting || !pseudo || !password}
            >
              {isSubmitting ? 'Connexion...' : 'Établir la Connexion Temporelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
