import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { Billboard, Image } from '@react-three/drei';

interface CollectibleProps {
    position: [number, number, number];
    id: string;
}

export const Collectible = ({ position }: CollectibleProps) => {
    const meshRef = useRef<THREE.Group>(null);
    const collectGarba = useGameStore(state => state.collectGarba);
    // Use ref for immediate logic lock to prevent multiple triggers per frame
    const collectedRef = useRef(false);
    const [isCollected, setIsCollected] = React.useState(false);

    useFrame((state) => {
        if (!meshRef.current || collectedRef.current) return;

        // Rotate
        meshRef.current.rotation.y += 0.02;
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;

        // Check collision with player
        const player = state.scene.getObjectByName("player");
        if (player) {
            const dist = meshRef.current.position.distanceTo(player.position);
            if (dist < 1.5) {
                // Immediate lock
                collectedRef.current = true;
                setIsCollected(true); // For UI/Render update
                collectGarba();
            }
        }
    });

    if (isCollected) return null;

    return (
        <group ref={meshRef} position={position}>
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <Image url="/attieke.png" scale={1.5} transparent />
            </Billboard>
            <pointLight distance={3} intensity={5} color="#FFD700" />
        </group>
    );
};
