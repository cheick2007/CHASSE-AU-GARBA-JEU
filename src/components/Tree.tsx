import { useMemo } from 'react';


interface TreeProps {
    position: [number, number, number];
    scale?: number;
}

export const Tree = ({ position, scale = 1 }: TreeProps) => {
    // Randomize slight variations
    const geometry = useMemo(() => {
        // Simple "Low Poly" style tree: 1 trunk, 2-3 foliage cones
        return {
            trunkHeight: 1 * scale,
            foliageHeight: 2.5 * scale,
        };
    }, [scale]);

    return (
        <group position={position}>
            {/* Trunk */}
            <mesh castShadow receiveShadow position={[0, geometry.trunkHeight / 2, 0]}>
                <cylinderGeometry args={[0.2 * scale, 0.3 * scale, geometry.trunkHeight, 6]} />
                <meshStandardMaterial color="#5c4033" roughness={0.9} />
            </mesh>

            {/* Foliage Layers */}
            <mesh castShadow receiveShadow position={[0, geometry.trunkHeight + 0.5 * scale, 0]}>
                <coneGeometry args={[1.2 * scale, 1.5 * scale, 8]} />
                <meshStandardMaterial color="#2d6a4f" roughness={0.8} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, geometry.trunkHeight + 1.2 * scale, 0]}>
                <coneGeometry args={[0.9 * scale, 1.2 * scale, 8]} />
                <meshStandardMaterial color="#40916c" roughness={0.8} />
            </mesh>
        </group>
    );
};
