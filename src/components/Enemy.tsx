import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

interface EnemyProps {
    startPos: [number, number, number];
}

export const Enemy = ({ startPos }: EnemyProps) => {
    const meshRef = useRef<THREE.Group>(null);
    const [state, setState] = useState<'IDLE' | 'ALERT' | 'ATTACK' | 'SEARCHING'>('IDLE');
    const { gameState, takeDamage } = useGameStore();

    // Health & ID
    const [hp, setHp] = useState(3);
    const id = useRef(`enemy-${Math.random().toString(36).substr(2, 9)}`);

    // Visual Feedback State
    const [hitFlash, setHitFlash] = useState(0);

    // Listen for hits
    useEffect(() => {
        const handleHit = (e: any) => {
            if (e.detail.id === id.current) {
                setHp(prev => prev - 1);
                setState('SEARCHING');
                setHitFlash(10);
            }
        };
        window.addEventListener('enemy-hit', handleHit);
        return () => window.removeEventListener('enemy-hit', handleHit);
    }, []);

    // AI Params
    const VIEW_ANGLE = Math.PI / 4;
    const VIEW_DIST = 10;
    const SPEED_IDLE = 2;
    const SPEED_CHASE = 4.5;

    // Wandering
    const targetPos = useRef(new THREE.Vector3(...startPos));
    const waitTime = useRef(0);
    const lastSeenTime = useRef(0);

    useFrame((stateContext, delta) => {
        // Always run hooks, even if dead logic inside handles return
        if (hp <= 0) return;

        if (hitFlash > 0) {
            setHitFlash(prev => Math.max(0, prev - 1));
            // Simple scale wobble
            if (meshRef.current) {
                const scale = 1 - (hitFlash * 0.05);
                meshRef.current.scale.set(scale, scale, scale);
            }
        } else if (meshRef.current) {
            // Restore scale
            meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }

        if (gameState !== 'PLAYING' || !meshRef.current) return;

        const player = stateContext.scene.getObjectByName("player");
        if (!player) return;

        const pos = meshRef.current.position;
        const playerPos = player.position;
        const dist = pos.distanceTo(playerPos);

        // 1. Vision Check (Stealth Mechanic)
        const toPlayer = playerPos.clone().sub(pos).normalize();
        const lookDir = new THREE.Vector3(0, 0, 1).applyQuaternion(meshRef.current.quaternion);
        const angle = lookDir.angleTo(toPlayer);

        let canSee = false;
        // Check vision cone or close proximity (hearing)
        if ((dist < VIEW_DIST && angle < VIEW_ANGLE) || dist < 3) {
            // Simple line of sight check could be added here with Raycaster
            canSee = true;
        }

        // Safe Zone Logic
        const SAFE_ZONE_CENTER = new THREE.Vector3(-20, 0, -20);
        const SAFE_ZONE_RADIUS = 15; // Slightly larger than visual ring (10) for buffer

        // Helper: Is a point in Safe Zone?
        const isInSafeZone = (p: THREE.Vector3) => p.distanceTo(SAFE_ZONE_CENTER) < SAFE_ZONE_RADIUS;

        // 2. State Machine
        switch (state) {
            case 'IDLE':
                if (canSee) {
                    setState('ATTACK');
                } else {
                    // Wander Logic
                    if (waitTime.current > 0) {
                        waitTime.current -= delta;
                    } else {
                        const distToTarget = pos.distanceTo(targetPos.current);
                        if (distToTarget < 1) {
                            // Pick new random target VALID (not in safe zone)
                            let attempts = 0;
                            do {
                                targetPos.current.set(
                                    (Math.random() - 0.5) * 40,
                                    0,
                                    (Math.random() - 0.5) * 40
                                );
                                attempts++;
                            } while (isInSafeZone(targetPos.current) && attempts < 10);

                            waitTime.current = 2 + Math.random() * 3;
                        } else {
                            const dir = targetPos.current.clone().sub(pos).normalize();
                            // Avoid entering safe zone (Simple avoidance)
                            const nextPos = pos.clone().add(dir.multiplyScalar(SPEED_IDLE * delta));
                            if (isInSafeZone(nextPos)) {
                                waitTime.current = 0; // Pick new target immediately if hitting barrier
                            } else {
                                pos.add(dir.multiplyScalar(SPEED_IDLE * delta));
                                meshRef.current.lookAt(targetPos.current.x, pos.y, targetPos.current.z);
                            }
                        }
                    }
                }
                break;

            case 'ATTACK':
                if (canSee) {
                    lastSeenTime.current = stateContext.clock.elapsedTime;

                    // Check if player is in safe zone
                    if (isInSafeZone(playerPos)) {
                        setState('SEARCHING'); // Give up
                        return;
                    }

                    // Chase Player
                    const dir = playerPos.clone().sub(pos).normalize();
                    const nextPos = pos.clone().add(dir.multiplyScalar(SPEED_CHASE * delta));

                    if (!isInSafeZone(nextPos)) {
                        pos.add(dir.multiplyScalar(SPEED_CHASE * delta));
                        meshRef.current.lookAt(playerPos.x, pos.y, playerPos.z);
                    } else {
                        setState('SEARCHING'); // Hit barrier
                    }

                    // Damage
                    if (dist < 1.2) {
                        if (Math.random() < 0.05) takeDamage(5);
                    }
                } else {
                    // Start Searching if lost sight
                    setState('SEARCHING');
                    waitTime.current = 3; // Search for 3 seconds
                }
                break;

            case 'SEARCHING':
                if (canSee) {
                    setState('ATTACK');
                } else {
                    // Spin/Look around
                    meshRef.current.rotation.y += 2 * delta;
                    waitTime.current -= delta;
                    if (waitTime.current <= 0) {
                        setState('IDLE');
                    }
                }
                break;
        }
    });

    if (hp <= 0) return null; // Early return MOVED to end

    return (
        <group ref={meshRef} position={startPos} name={id.current}>
            {/* Body */}
            <mesh castShadow receiveShadow position={[0, 1, 0]}>
                <boxGeometry args={[1, 2, 1]} />
                <meshStandardMaterial color={state === 'ATTACK' ? '#ff0000' : state === 'SEARCHING' ? '#ffa500' : '#555555'} />
            </mesh>
            {/* Exclamation mark when attacking */}
            {state === 'ATTACK' && (
                <mesh position={[0, 2.5, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="red" />
                </mesh>
            )}
            {/* Question mark when searching */}
            {state === 'SEARCHING' && (
                <mesh position={[0, 2.5, 0]}>
                    <sphereGeometry args={[0.2]} />
                    <meshBasicMaterial color="orange" />
                </mesh>
            )}
            {/* Vision Cone (Visual Debug - Faint) */}
            <mesh position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[VIEW_DIST * 0.5, VIEW_DIST, 32, 1, true, 0, VIEW_ANGLE * 2]} />
                <meshBasicMaterial color={state === 'ATTACK' ? 'red' : 'yellow'} opacity={0.1} transparent side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};
