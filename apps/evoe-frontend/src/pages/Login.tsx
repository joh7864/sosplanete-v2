import React, { useState, useEffect } from 'react';
import { Hexagon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import pkg from '../../package.json';
import './Login.css';

export default function Login() {
  const { loginUser, errorAuthentification, instanceChoices, user } = useAuth();
  const navigate = useNavigate();

  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [keepLogged, setKeepLogged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ margin: 0 }}>EVOE 2026</h1>
            <span style={{ fontSize: '0.75rem', color: '#00ffcc', opacity: 0.8, fontFamily: 'monospace', marginTop: '2px', letterSpacing: '0.05em' }}>
              v{pkg.version}
            </span>
          </div>
        </div>

        <div className="login-body">
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

              <div className="form-group password-group">
                <label>Clé de Décryptage</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                  />
                  <button 
                    type="button" 
                    className="eye-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
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
    </div>
  );
}
