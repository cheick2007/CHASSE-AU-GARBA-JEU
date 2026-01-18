import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export const Settings = ({ onClose }: { onClose: () => void }) => {
    // Ideally this would come from a context or store, but for now we hardcode the display
    // editing keys with R3F KeyboardControls is non-trivial without a custom store wrapper
    const [keys] = useState([
        { action: 'Avancer', key: 'Z / ArrowUp' },
        { action: 'Reculer', key: 'S / ArrowDown' },
        { action: 'Gauche', key: 'Q / ArrowLeft' },
        { action: 'Droite', key: 'D / ArrowRight' },
        { action: 'Sauter', key: 'Espace' },
        { action: 'Attaquer', key: 'Entrée / E' },
    ]);

    return (
        <div className="menu-overlay" style={{ background: 'rgba(0,0,0,0.9)' }}>
            <h2 className="menu-title" style={{ fontSize: '2.5rem' }}>Paramètres</h2>

            <div className="settings-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '40px',
                textAlign: 'left'
            }}>
                {keys.map((k, i) => (
                    <React.Fragment key={i}>
                        <div style={{ color: '#aaa' }}>{k.action}</div>
                        <div style={{ fontWeight: 'bold', color: '#FFD700' }}>{k.key}</div>
                    </React.Fragment>
                ))}
            </div>

            <button onClick={onClose} className="btn btn-medium">Retour</button>
        </div>
    );
};
