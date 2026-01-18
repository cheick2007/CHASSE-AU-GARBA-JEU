import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { Text } from '@react-three/drei';

interface GemProps {
    id: string;
    position: [number, number, number];
}

export const Gem = ({ id, position }: GemProps) => {
    const meshRef = useRef<THREE.Group>(null);
    const addGems = useGameStore(state => state.addGems);
    const collectedRef = useRef(false);
    const [isCollected, setIsCollected] = useState(false);

    useFrame((state) => {
        if (!meshRef.current || collectedRef.current) return;

        // Spin and float
        meshRef.current.rotation.y += 0.03;
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.15;

        // Check collision
        const player = state.scene.getObjectByName('player');
        if (player) {
            const dist = player.position.distanceTo(meshRef.current.position);
            if (dist < 1.5) {
                // Collect
                collectedRef.current = true;
                setIsCollected(true);
                addGems(1);
            }
        }
    });

    if (isCollected) return null;

    return (
        <group ref={meshRef} position={position}>
            <mesh castShadow>
                {/* Diamond shape */}
                <octahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#A855F7" emissive="#A855F7" emissiveIntensity={0.8} />
            </mesh>
            <pointLight distance={2} intensity={2} color="#A855F7" />
        </group>
    );
};
