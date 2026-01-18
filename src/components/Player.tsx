import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

const SPEED = 5;

interface PlayerProps {
    obstacles?: { pos: [number, number, number], size: number }[];
}

import { useShallow } from 'zustand/react/shallow';

// ...

export const Player = ({ obstacles = [] }: PlayerProps) => {
    const meshRef = useRef<THREE.Group>(null);
    const [, get] = useKeyboardControls();
    const { camera } = useThree();

    // Select only what we need to minimize re-renders
    const {
        gameState,
        isInvincible,
        setInvincible,
        respawnPlayer,
        health,
        isFirstPerson,
        setFirstPerson,
        skins
    } = useGameStore(useShallow(state => ({
        gameState: state.gameState,
        isInvincible: state.isInvincible,
        setInvincible: state.setInvincible,
        respawnPlayer: state.respawnPlayer,
        health: state.health,
        isFirstPerson: state.isFirstPerson,
        setFirstPerson: state.setFirstPerson,
        skins: state.skins
    })));

    // Toggle View Handler (V)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyV') setFirstPerson(!isFirstPerson);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFirstPerson, setFirstPerson]);

    // Check for death
    useEffect(() => {
        if (health <= 0 && gameState === 'GAME_OVER') {
            respawnPlayer();
        }
    }, [health, gameState, respawnPlayer]);

    // Handle Respawn & Load Position
    useEffect(() => {
        if (isInvincible && meshRef.current) {
            // Check if we have a saved position different from origin (approx)
            // Or just trust the store if we just loaded.
            // But 'respawnPlayer' resets invincibility too.
            // Let's rely on standard respawn pos (-20, 1, -20) ONLY if killed.
            // If loaded, we want saved pos.

            // Getting raw state to check if we just loaded or died is tricky with just one 'isInvincible' flag.
            // However, useGameStore sets isInvincible=true on Load too.
            // Let's reset to Store's PlayerPosition if it exists and isn't (0,0) (default init).
            const storedPos = useGameStore.getState().playerPosition;
            if (storedPos.x !== 0 || storedPos.z !== 0) {
                meshRef.current.position.set(storedPos.x, 1, storedPos.z);
            } else {
                meshRef.current.position.set(-20, 1, -20);
            }

            const timer = setTimeout(() => setInvincible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isInvincible, setInvincible]);

    const shootCooldown = useRef(0);
    const [mouseDown, setMouseDown] = useState(false);

    useEffect(() => {
        const startShoot = (e: MouseEvent) => e.button === 0 && setMouseDown(true);
        const endShoot = (e: MouseEvent) => e.button === 0 && setMouseDown(false);
        window.addEventListener('mousedown', startShoot);
        window.addEventListener('mouseup', endShoot);
        return () => {
            window.removeEventListener('mousedown', startShoot);
            window.removeEventListener('mouseup', endShoot);
        };
    }, []);

    useFrame((state, delta) => {
        if (gameState !== 'PLAYING' || !meshRef.current) return;

        const { forward, backward, left, right } = get();

        // 1. Movement Logic
        const moveDir = new THREE.Vector3();
        if (forward) moveDir.z -= 1;
        if (backward) moveDir.z += 1;
        if (left) moveDir.x -= 1;
        if (right) moveDir.x += 1;

        if (moveDir.length() > 0) {
            moveDir.normalize().multiplyScalar(SPEED * delta);

            // Adjust Move Direction based on View Mode
            if (isFirstPerson) {
                // FPS: Move relative to Camera Look Direction (ignoring Y)
                const camDir = new THREE.Vector3();
                state.camera.getWorldDirection(camDir);
                camDir.y = 0;
                camDir.normalize();

                const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0));

                const finalMove = new THREE.Vector3();
                if (forward) finalMove.add(camDir);
                if (backward) finalMove.sub(camDir);
                if (left) finalMove.sub(camRight);
                if (right) finalMove.add(camRight);

                if (finalMove.length() > 0) {
                    finalMove.normalize().multiplyScalar(SPEED * delta);

                    // Collision Check
                    const nextPos = meshRef.current.position.clone().add(finalMove);
                    let collided = false;
                    for (let obs of obstacles) {
                        const obsPos = new THREE.Vector3(...obs.pos);
                        // Player radius 0.5 + Obstacle radius (size/2)
                        if (nextPos.distanceTo(obsPos) < (0.5 + obs.size / 2)) {
                            collided = true;
                            break;
                        }
                    }

                    if (!collided) {
                        meshRef.current.position.add(finalMove);
                        meshRef.current.rotation.y = Math.atan2(camDir.x, camDir.z);
                    }
                }

            } else {
                // TPS
                const nextPos = meshRef.current.position.clone().add(moveDir);
                let collided = false;
                for (let obs of obstacles) {
                    const obsPos = new THREE.Vector3(...obs.pos);
                    if (nextPos.distanceTo(obsPos) < (0.5 + obs.size / 2)) {
                        collided = true;
                        break;
                    }
                }
                if (!collided) {
                    meshRef.current.position.add(moveDir);
                    meshRef.current.rotation.y = Math.atan2(moveDir.x, moveDir.z);
                }
            }
        }


        // 2. Camera Logic
        if (isFirstPerson) {
            // PointerLock controls camera natively, but checking if we need to sync position
            state.camera.position.copy(meshRef.current.position).add(new THREE.Vector3(0, 1.5, 0));
        } else {
            // TPS: Look at player
            const offset = new THREE.Vector3(0, 12, 10);
            const targetCamPos = meshRef.current.position.clone().add(offset);
            state.camera.position.lerp(targetCamPos, 0.1);
            state.camera.lookAt(meshRef.current.position);
        }

        // 3. Shooting (Mouse Click)
        if (shootCooldown.current > 0) shootCooldown.current -= delta;
        if (mouseDown && shootCooldown.current <= 0) {
            shoot();
            shootCooldown.current = 0.25;
        }

        // Update MiniMap Position (Every frame is fine for single component)
        useGameStore.getState().setPlayerPosition(
            meshRef.current.position.x,
            meshRef.current.position.z,
            meshRef.current.rotation.y
        );
    });

    const [laser, setLaser] = useState<{ start: THREE.Vector3, end: THREE.Vector3 } | null>(null);
    const laserTimeout = useRef<any>(null);

    // Get access to mouse and raycaster from useThree
    const { raycaster, mouse } = useThree();

    const shoot = () => {
        if (!meshRef.current) return;

        // Origin: Head/Camera position
        const origin = meshRef.current.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        let direction = new THREE.Vector3();

        if (isFirstPerson) {
            // FPS: Shoot exactly where looking
            camera.getWorldDirection(direction);
            direction.normalize();
        } else {
            // TPS: Shoot at Mouse Cursor
            raycaster.setFromCamera(mouse, camera);

            // Find World Point to shoot at
            // Intersect with a virtual ground plane or enemies to find target point
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const target = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, target);

            // Also check enemies to see if we are aiming directly at one
            const sceneObj = meshRef.current.parent;
            if (sceneObj) {
                const hits = raycaster.intersectObjects(sceneObj.children, true);
                // Filter out player
                const validHit = hits.find(h => {
                    let p = h.object;
                    while (p.parent && p.name !== 'player') p = p.parent;
                    return p.name !== 'player';
                });

                if (validHit) {
                    target.copy(validHit.point);
                } else {
                    // If no hit, aim at point far away in ray direction
                    raycaster.ray.at(50, target);
                }
            }

            // Calculate Direction from Player Head to Target
            direction.subVectors(target, origin).normalize();

            // Rotate Player to face shot
            meshRef.current.rotation.y = Math.atan2(direction.x, direction.z);
        }

        // Raycast for Hitscan (using calculated direction from Player Head)
        // const hitRaycaster = new THREE.Raycaster(origin, direction, 0, 100); // Unused variable removed

        // Find targets (Enemies)

        // Find targets (Enemies)
        // Note: traversing scene to find enemies.
        // Optimization: Game could pass enemies array ref, but scene scan is acceptable for low count.
        const enemies: THREE.Object3D[] = [];
        meshRef.current.parent?.traverse((obj) => {
            if (obj.name.startsWith('enemy-')) {
                enemies.push(obj);
            }
        });

        const intersects = raycaster.intersectObjects(enemies, true); // Recursive check

        let endPoint = origin.clone().add(direction.clone().multiplyScalar(50)); // Default long beam

        if (intersects.length > 0) {
            // HIT!
            const hit = intersects[0];
            endPoint = hit.point;

            // Find root enemy object name
            let enemyObj = hit.object;
            // Climb up to find the group with name 'enemy-...'
            while (enemyObj.parent && !enemyObj.name.startsWith('enemy-')) {
                enemyObj = enemyObj.parent;
            }

            if (enemyObj.name.startsWith('enemy-')) {
                // Dispatch Hit Event
                const event = new CustomEvent('enemy-hit', { detail: { id: enemyObj.name } });
                window.dispatchEvent(event);

                // Visual Feedback: Green line for hit
                // (Handled below)
            }
        }

        // Show Laser Line
        setLaser({ start: origin.clone().add(new THREE.Vector3(0, -0.2, 0)), end: endPoint }); // Offset visually slightly
        if (laserTimeout.current) clearTimeout(laserTimeout.current);
        laserTimeout.current = setTimeout(() => setLaser(null), 100); // 100ms flash
    };

    return (
        <>
            <group ref={meshRef} name="player">
                {/* Only activate PointerLock in FPS mode */}
                {isFirstPerson && <PointerLockControls camera={camera} />}

                <mesh castShadow receiveShadow position={[0, 0.75, 0]} visible={!isFirstPerson}>
                    <capsuleGeometry args={[0.5, 1.5, 4, 8]} />
                    <meshStandardMaterial color={skins.color} />
                </mesh>
                <mesh position={[0.2, 1.2, 0.4]} visible={!isFirstPerson}>
                    <sphereGeometry args={[0.1]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <mesh position={[-0.2, 1.2, 0.4]} visible={!isFirstPerson}>
                    <sphereGeometry args={[0.1]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <group position={[0.6, 0.8, 0.5]}>
                    <mesh castShadow visible={!isFirstPerson}>
                        <boxGeometry args={[0.2, 0.2, 0.8]} />
                        <meshStandardMaterial color={skins.weaponColor} />
                    </mesh>
                </group>

                {/* Visual Projectiles (Tracers) - REMOVED as per user request */}

                {/* Muzzle Flash (Kept for feedback) */}
                {/* Muzzle Flash */}
                {laser && (
                    <mesh position={[0.2, 1.2, 0.8]}>
                        <sphereGeometry args={[0.15]} />
                        <meshBasicMaterial color="orange" />
                    </mesh>
                )}
            </group>
        </>
    );
};
