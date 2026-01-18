import { useGameStore } from '../store/useGameStore';

export const Shop = ({ onClose }: { onClose: () => void }) => {
    const { gems, buySkin, buyUpgrade, upgrades } = useGameStore();

    return (
        <div className="menu-overlay" style={{ background: 'rgba(0,0,0,0.95)' }}>
            <h1 className="menu-title">BOUTIQUE 💎 {gems}</h1>

            <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>

                {/* Skins Section */}
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                    <h2 style={{ color: 'white', borderBottom: '2px solid white', paddingBottom: '10px' }}>Apparence</h2>

                    <div className="shop-item">
                        <span>🔴 Rouge (Joueur)</span>
                        <button className="btn btn-medium" onClick={() => buySkin('player', '#ef4444', 50)} disabled={gems < 50}>
                            50 💎
                        </button>
                    </div>
                    <div className="shop-item">
                        <span>🔵 Bleu (Joueur)</span>
                        <button className="btn btn-medium" onClick={() => buySkin('player', '#3b82f6', 50)} disabled={gems < 50}>
                            50 💎
                        </button>
                    </div>
                    <div className="shop-item">
                        <span>🟢 Vert (Arme)</span>
                        <button className="btn btn-medium" onClick={() => buySkin('weapon', '#22c55e', 30)} disabled={gems < 30}>
                            30 💎
                        </button>
                    </div>
                    <div className="shop-item">
                        <span>👑 Or (Arme)</span>
                        <button className="btn btn-medium" onClick={() => buySkin('weapon', '#facc15', 100)} disabled={gems < 100}>
                            100 💎
                        </button>
                    </div>
                </div>

                {/* Upgrades Section */}
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                    <h2 style={{ color: 'white', borderBottom: '2px solid white', paddingBottom: '10px' }}>Améliorations</h2>

                    <div className="shop-item">
                        <span>❤️ Max Vie (+50)</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Actuel: {upgrades.maxHealth}</span>
                        <button className="btn btn-medium" onClick={() => buyUpgrade('health', 100)} disabled={gems < 100}>
                            100 💎
                        </button>
                    </div>
                </div>

            </div>

            <button onClick={onClose} className="btn" style={{ marginTop: '40px' }}>Fermer</button>

            <style>{`
                .shop-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 300px;
                    margin: 10px 0;
                    color: white;
                    font-size: 1.2rem;
                }
            `}</style>
        </div>
    );
};
