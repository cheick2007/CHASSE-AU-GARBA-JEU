import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Sky, Stars } from '@react-three/drei';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Collectible } from './Collectible';
import { UI } from './UI';
import { useGameStore } from '../store/useGameStore';
import * as THREE from 'three';
import { PowerUp } from './PowerUp';
import { Tree } from './Tree';
import { Gem } from './Gem';

// Level Configuration
const getLevelConfig = (level: number) => {
    // Difficulty scaler (Aggressive scaling for 100 levels)
    const enemyCount = 8 + (level * 3); // More enemies
    const obstacleCount = 20 + (level * 2);
    const mapSize = 100 + (level * 10); // Map grows slower
    const powerUpCount = 2 + Math.floor(level / 2);
    const gemCount = Math.min(20, 5 + level); // Max 20 gems
    return { enemyCount, obstacleCount, mapSize, powerUpCount, gemCount };
};

import { useShallow } from 'zustand/react/shallow';

// ...

export const Game = () => {
    const { gameState, level, nextLevel } = useGameStore(
        useShallow((state) => ({
            gameState: state.gameState,
            level: state.level,
            nextLevel: state.nextLevel
        }))
    );

    // Cinematic Transition Handler
    React.useEffect(() => {
        if (gameState === 'LEVEL_TRANSITION') {
            const timer = setTimeout(() => {
                nextLevel();
            }, 3000); // 3 seconds cinematic
            return () => clearTimeout(timer);
        }
    }, [gameState, nextLevel]);

    const config = getLevelConfig(level);

    const keyboardMap = useMemo(() => [
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['Space'] },
    ], []);

    // ... Entities Memoization ...
    const enemies = useMemo(() => Array.from({ length: config.enemyCount }).map((_, i) => {
        let pos: [number, number, number];
        const range = config.mapSize / 2;
        do {
            pos = [(Math.random() - 0.5) * range * 2, 0, (Math.random() - 0.5) * range * 2];
        } while (
            new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(-20, 0, -20)) < 15 ||
            new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(0, 0, 0)) < 15
        );
        return { id: `enemy-lvl${level}-${i}`, pos };
    }), [level, config]);

    const obstacles = useMemo(() => Array.from({ length: config.obstacleCount }).map((_, i) => {
        const range = config.mapSize / 2;
        return {
            pos: [(Math.random() - 0.5) * range * 2, 0, (Math.random() - 0.5) * range * 2] as [number, number, number],
            size: 2 + Math.random() * 4
        };
    }), [level, config]);

    const garbas = useMemo(() => Array.from({ length: 3 }).map((_, i) => ({
        id: `garba-lvl${level}-${i}`,
        pos: [(Math.random() - 0.5) * (config.mapSize / 2), 1, (Math.random() - 0.5) * (config.mapSize / 2)] as [number, number, number]
    })), [level, config]);

    const powerups = useMemo(() => Array.from({ length: config.powerUpCount }).map((_, i) => ({
        id: `powerup-lvl${level}-${i}`,
        pos: [(Math.random() - 0.5) * (config.mapSize / 2), 1, (Math.random() - 0.5) * (config.mapSize / 2)] as [number, number, number],
        type: Math.random() > 0.5 ? 'health' : 'armor' as 'health' | 'armor'
    })), [level, config]);

    const gems = useMemo(() => Array.from({ length: config.gemCount }).map((_, i) => ({
        id: `gem-lvl${level}-${i}`,
        pos: [(Math.random() - 0.5) * (config.mapSize / 2), 1, (Math.random() - 0.5) * (config.mapSize / 2)] as [number, number, number]
    })), [level, config]);

    // Update MiniMap Data
    React.useEffect(() => {
        useGameStore.getState().setMapObjects({
            garbas: garbas.map(g => ({ x: g.pos[0], z: g.pos[2] })),
            gems: gems.map(g => ({ x: g.pos[0], z: g.pos[2] })),
            enemies: enemies.map(e => ({ x: e.pos[0], z: e.pos[2] }))
        });
    }, [garbas, gems, enemies]);


    return (
        <div className="game-container">
            <UI />
            <KeyboardControls map={keyboardMap}>
                <Canvas shadows camera={{ position: [0, 10, 10], fov: 60 }}>
                    {/* Visuals */}
                    <Sky sunPosition={[100, 20, 100]} turbidity={0.4} rayleigh={0.7} mieCoefficient={0.005} mieDirectionalG={0.8} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <ambientLight intensity={0.4} />
                    <directionalLight
                        position={[50, 50, 25]}
                        intensity={1.5}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-left={-config.mapSize / 2}
                        shadow-camera-right={config.mapSize / 2}
                        shadow-camera-top={config.mapSize / 2}
                        shadow-camera-bottom={-config.mapSize / 2}
                    />

                    {/* World Floor */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[config.mapSize * 2, config.mapSize * 2]} />
                        <meshStandardMaterial color="#2d4c1e" roughness={1} />
                    </mesh>

                    {/* Safe Zone Visual */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, 0.05, -20]} receiveShadow>
                        <ringGeometry args={[9.5, 10, 64]} />
                        <meshBasicMaterial color="#00ff00" opacity={0.5} transparent />
                    </mesh>

                    {/* Game Objects */}
                    {gameState !== 'MENU' && (
                        <>
                            {/* Pass obstacles to player for collision */}
                            <Player obstacles={obstacles} />

                            {enemies.map(e => <Enemy key={e.id} startPos={e.pos} />)}
                            {garbas.map(g => <Collectible key={g.id} id={g.id} position={g.pos} />)}
                            {powerups.map(p => <PowerUp key={p.id} id={p.id} position={p.pos} type={p.type} />)}
                            {gems.map(g => <Gem key={g.id} id={g.id} position={g.pos} />)}

                            {/* Obstacles (Trees) */}
                            {obstacles.map((o, i) => (
                                <Tree key={i} position={o.pos} scale={o.size / 2} />
                            ))}
                        </>
                    )}

                    {gameState === 'MENU' && (
                        <Player />
                    )}
                </Canvas>
            </KeyboardControls>
        </div>
    );
};
