import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { Text } from '@react-three/drei';

interface PowerUpProps {
    id: string;
    position: [number, number, number];
    type: 'health' | 'armor';
}

export const PowerUp = ({ id, position, type }: PowerUpProps) => {
    const meshRef = useRef<THREE.Group>(null);
    const addToInventory = useGameStore(state => state.addToInventory);

    // Use ref for immediate lock
    const collectedRef = useRef(false);
    const [isCollected, setIsCollected] = useState(false);

    useFrame((state) => {
        if (!meshRef.current || collectedRef.current) return;

        // Floating animation
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        meshRef.current.rotation.y += 0.02;

        // Check distance to player for pickup
        const player = state.scene.getObjectByName('player');
        if (player) {
            const dist = player.position.distanceTo(meshRef.current.position);
            if (dist < 1.5) {
                // Pickup
                collectedRef.current = true;
                setIsCollected(true);

                if (type === 'health') addToInventory('health_pack');
                if (type === 'armor') addToInventory('armor_pack');

                const event = new CustomEvent('powerup-collected', { detail: { id } });
                window.dispatchEvent(event);
            }
        }
    });

    const color = type === 'health' ? '#ef4444' : '#3b82f6';
    const icon = type === 'health' ? '+' : '🛡️';

    if (isCollected) return null;

    return (
        <group ref={meshRef} position={position}>
            <mesh castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
            <Text
                position={[0, 0.6, 0]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="black"
            >
                {icon}
            </Text>
            {/* Glow */}
            <pointLight distance={3} intensity={0.5} color={color} />
        </group>
    );
};
