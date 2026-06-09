import React, { useState } from 'react';
import './Dashboard.css';
import Header from '../../components/Header';
import EcoBarRaceView from './components/EcoBarRaceView';
import TrackingMatrixView from './components/TrackingMatrixView';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('impact');

    return (
        <div className="dashboard-page">
            <Header title="Mission Planète" icon="🌍" />
            
            <div className="dashboard-content-wrapper">
                <div className="dashboard-tabs">
                    <button 
                        className={`dashboard-tab ${activeTab === 'impact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('impact')}
                    >
                        Impact Global
                    </button>
                    <button 
                        className={`dashboard-tab ${activeTab === 'tracking' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracking')}
                    >
                        Suivi des Actions
                    </button>
                </div>

                <div className="dashboard-tab-content">
                    {activeTab === 'impact' && <EcoBarRaceView />}
                    {activeTab === 'tracking' && <TrackingMatrixView />}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
