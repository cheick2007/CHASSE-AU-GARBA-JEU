import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BulletProps {
    startPos: THREE.Vector3;
    direction: THREE.Vector3;
    onHit: (id: string) => void;
    onDestroy: () => void;
}

const BULLET_SPEED = 20;

export const Bullet = ({ startPos, direction, onHit, onDestroy }: BulletProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [dead, setDead] = useState(false);
    const lifeTime = useRef(2);

    useFrame((state, delta) => {
        if (dead || !meshRef.current) return;

        // Move
        meshRef.current.position.add(direction.clone().multiplyScalar(BULLET_SPEED * delta));

        // Lifetime check
        lifeTime.current -= delta;
        if (lifeTime.current <= 0) {
            setDead(true);
            onDestroy();
            return;
        }

        // Collision Check (Traverse for safety)
        const enemies: THREE.Object3D[] = [];
        state.scene.traverse((obj) => {
            if (obj.name && obj.name.startsWith('enemy-')) {
                enemies.push(obj);
            }
        });

        for (let enemy of enemies) {
            const dist = enemy.position.distanceTo(meshRef.current.position);
            // Hit radius increased to 2.5 to account for height difference
            if (dist < 2.5) {
                // Hit
                onHit(enemy.name);
                setDead(true);
                onDestroy();
                return;
            }
        }
    });

    if (dead) return null;

    return (
        <mesh ref={meshRef} position={startPos}>
            <sphereGeometry args={[0.2]} />
            <meshBasicMaterial color="yellow" />
        </mesh>
    );
};
