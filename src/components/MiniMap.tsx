import { useGameStore } from '../store/useGameStore';
import { useShallow } from 'zustand/react/shallow';

export const MiniMap = () => {
    const { mapObjects, playerPosition, playerRotation, level } = useGameStore(useShallow(state => ({
        mapObjects: state.mapObjects,
        playerPosition: state.playerPosition,
        playerRotation: state.playerRotation,
        level: state.level
    })));

    // Calculate Scale to fit map in mini-window
    // MapSize formula from Game.tsx: 100 + (level * 10)
    // We want to fit this into ~140px (150px container with padding)
    const worldSize = 100 + (level * 10);
    const MAP_PIXEL_SIZE = 150;
    const SCALE = (MAP_PIXEL_SIZE - 10) / worldSize;
    const CENTER = MAP_PIXEL_SIZE / 2;

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: `${MAP_PIXEL_SIZE}px`,
            height: `${MAP_PIXEL_SIZE}px`,
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.8)', // Darker background for contrast
            border: '2px solid rgba(255, 255, 255, 0.5)',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 100
        }}>

            {/* Items Container (Static relative to MiniMap Center) */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>

                {/* Garbas */}
                {mapObjects.garbas.map((g, i) => (
                    <div key={`g-${i}`} style={{
                        position: 'absolute',
                        left: `${CENTER + g.x * SCALE}px`,
                        top: `${CENTER + g.z * SCALE}px`,
                        width: '6px',
                        height: '6px',
                        background: '#facc15',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 2px black'
                    }} />
                ))}

                {/* Gems */}
                {mapObjects.gems.map((g, i) => (
                    <div key={`d-${i}`} style={{
                        position: 'absolute',
                        left: `${CENTER + g.x * SCALE}px`,
                        top: `${CENTER + g.z * SCALE}px`,
                        width: '4px',
                        height: '4px',
                        background: '#A855F7',
                        transform: 'translate(-50%, -50%) rotate(45deg)'
                    }} />
                ))}

                {/* Enemies */}
                {mapObjects.enemies.map((e, i) => (
                    <div key={`e-${i}`} style={{
                        position: 'absolute',
                        left: `${CENTER + e.x * SCALE}px`,
                        top: `${CENTER + e.z * SCALE}px`,
                        width: '6px',
                        height: '6px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)'
                    }} />
                ))}

                {/* Player Arrow (Moves on the Map) */}
                <div style={{
                    position: 'absolute',
                    left: `${CENTER + playerPosition.x * SCALE}px`,
                    top: `${CENTER + playerPosition.z * SCALE}px`,
                    width: '0',
                    height: '0',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: '8px solid white', // Arrow pointing "Up" relative to rotation
                    transform: `translate(-50%, -50%) rotate(${Math.PI - playerRotation}rad)`,
                    // Rotation Explanation: 
                    // Player rotation 0 usually faces -Z (North).
                    // This arrow points -Y (Up) by default with borderBottom.
                }} />

            </div>

        </div>
    );
};
