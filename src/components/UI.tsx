import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Settings } from './Settings';
import { Shop } from './Shop';
import { MiniMap } from './MiniMap';

export const UI = () => {
    const {
        gameState, score, health, maxHealth, garbaFragments, inventory, isFirstPerson,
        resetGame, togglePause, gems, level, armor
    } = useGameStore(useShallow(state => ({
        gameState: state.gameState,
        score: state.score,
        health: state.health,
        maxHealth: state.maxHealth,
        garbaFragments: state.garbaFragments,
        inventory: state.inventory,
        isFirstPerson: state.isFirstPerson,
        resetGame: state.resetGame,
        togglePause: state.togglePause,
        gems: state.gems,
        level: state.level,
        armor: state.armor
    })));

    const [showSettings, setShowSettings] = useState(false);
    const [showShop, setShowShop] = useState(false);

    if (showSettings) {
        return <Settings onClose={() => setShowSettings(false)} />;
    }

    if (showShop) {
        return <Shop onClose={() => setShowShop(false)} />;
    }

    if (gameState === 'PAUSED') {
        return (
            <div className="menu-overlay">
                <h1 className="menu-title">PAUSE</h1>
                <div className="btn-group">
                    <button onClick={togglePause} className="btn" style={{ background: 'green' }}>Reprendre</button>
                    <button onClick={() => setShowShop(true)} className="btn btn-medium" style={{ background: '#A855F7' }}>💎 Boutique</button>
                    <button onClick={() => setShowSettings(true)} className="btn btn-medium">Paramètres</button>
                    <button onClick={() => { useGameStore.getState().saveGame(); }} className="btn btn-medium">💾 Sauvegarder</button>
                    <button onClick={() => useGameStore.getState().setGameState('MENU')} className="btn btn-hard">Quitter</button>
                </div>
            </div>
        );
    }

    if (gameState === 'MENU') {
        return (
            <div className="menu-overlay">
                <h1 className="menu-title">
                    Zongo et la Quête du Garba 3D
                </h1>
                <p className="menu-desc">
                    Traverse les terres mystiques, évite les ennemis (ils ont une vision limitée!) et retrouve les fragments sacrés.
                </p>
                <div className="btn-group">
                    <button onClick={() => resetGame('easy')} className="btn btn-easy">Facile</button>
                    <button onClick={() => resetGame('medium')} className="btn btn-medium">Moyen</button>
                    <button onClick={() => resetGame('hard')} className="btn btn-hard">Difficile</button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button onClick={() => useGameStore.getState().loadGame()} className="btn" style={{ background: '#3b82f6' }}>📂 Charger Partie</button>
                    <button onClick={() => setShowShop(true)} className="btn" style={{ background: '#A855F7' }}>💎 Boutique</button>
                </div>

                <button
                    onClick={() => setShowSettings(true)}
                    className="btn"
                    style={{ marginTop: '20px', background: 'transparent', border: '1px solid white', fontSize: '1rem' }}
                >
                    ⚙️ Paramètres
                </button>
            </div>
        );
    }

    if (gameState === 'LEVEL_TRANSITION') {
        return (
            <div className="menu-overlay" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
                <h1 className="menu-title" style={{ color: '#22d3ee', fontSize: '3rem', animation: 'pulse 2s infinite' }}>
                    NIVEAU COMPLETE !
                </h1>
                <p className="menu-desc" style={{ fontSize: '1.5rem' }}>Préparez-vous pour le niveau suivant...</p>
                <div style={{ marginTop: '20px', fontSize: '2rem' }}>
                    🚀
                </div>
            </div>
        );
    }

    if (gameState === 'GAME_OVER' || gameState === 'VICTORY') {
        return (
            <div className="menu-overlay">
                <h1 className="menu-title" style={{ color: gameState === 'VICTORY' ? '#facc15' : '#ef4444' }}>
                    {gameState === 'VICTORY' ? 'VICTOIRE !' : 'GAME OVER'}
                </h1>
                <p className="menu-desc">Score Final: {score}</p>
                <button onClick={() => resetGame()} className="btn btn-replay">Rejouer</button>
            </div>
        );
    }

    return (
        <div className="ui-overlay">
            {/* Top Center: Level Display */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                zIndex: 10
            }}>
                NIVEAU {level}
            </div>

            {/* Top Right: Stats */}
            <div className="hud-stats">
                <div className="stat-row">
                    <span>❤️</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {/* Health Bar */}
                        <div className="health-bar-container">
                            <div
                                className="health-bar-fill"
                                style={{ width: `${(health / maxHealth) * 100}%` }}
                            />
                            <span className="health-text">
                                {health}/{maxHealth}
                            </span>
                        </div>
                        {/* Shield Bar - Always visible */}
                        <div className="health-bar-container" style={{ marginTop: '5px', borderColor: '#3b82f6' }}>
                            <div
                                className="health-bar-fill"
                                style={{
                                    width: `${Math.min(100, (armor || 0))}%`, // Assuming max armor is 100 for percentage
                                    background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)'
                                }}
                            />
                            <span className="health-text">
                                🛡️ {armor || 0}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="stat-row">
                    <span style={{ color: '#facc15' }}>⭐</span>
                    <span>{score}</span>
                </div>
                <div className="stat-row">
                    {/* Attieke Icon */}
                    <img src="/attieke.png" alt="Attieke" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                    <span>{garbaFragments}/3</span>
                </div>
                <div className="stat-row">
                    <span style={{ color: '#A855F7' }}>💎</span>
                    <span>{gems}</span>
                </div>
            </div>

            {/* Top Right: Menu Buttons */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 100,
                pointerEvents: 'auto',
                display: 'flex',
                gap: '10px'
            }}>
                <button
                    onClick={() => useGameStore.getState().saveGame()}
                    className="btn-icon"
                    title="Sauvegarder"
                    style={{ fontSize: '1.5rem', padding: '10px' }}
                >
                    💾
                </button>
                <button
                    onClick={togglePause}
                    className="btn-icon"
                    title="Pause"
                    style={{ fontSize: '1.5rem', padding: '10px' }}
                >
                    ⏸️
                </button>
            </div>

            {/* Bottom Right: Inventory (kept same) */}
            <div className="hud-inventory">
                <h3 className="inventory-title">Inventaire</h3>
                <div className="inventory-slots">
                    {inventory.map((item, i) => (
                        <div key={i} className="slot" title={item}>
                            {item === 'sword' ? '🗡️' : '📦'}
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls Hint */}
            <div className="controls-hint">
                <p>ZQSD / Arrows to Move</p>
                <p>SPACE to Jump | Click to Shoot</p>
            </div>

            {/* Controls Hint */}
            <div className="controls-hint">
                <p>ZQSD / Arrows to Move</p>
                <p>SPACE to Jump | Click to Shoot</p>
            </div>

            {/* Crosshair (Center Screen) - Only in FPS Mode */}
            {isFirstPerson && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '20px',
                    height: '20px',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Horizontal Line */}
                    <div style={{ position: 'absolute', width: '20px', height: '2px', background: 'rgba(255, 255, 255, 0.8)' }}></div>
                    {/* Vertical Line */}
                    <div style={{ position: 'absolute', width: '2px', height: '20px', background: 'rgba(255, 255, 255, 0.8)' }}></div>
                    {/* Dot */}
                    <div style={{ width: '4px', height: '4px', background: 'red', borderRadius: '50%', zIndex: 10 }}></div>
                </div>
            )}

            <MiniMap />

            {/* Debug Button Removed */}
        </div>
    );
};
