import React, { useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Bullet } from './Bullet';

export const BulletManager = () => {
    const { bullets, removeBullet } = useGameStore();

    const handleHitEnemy = useCallback((enemyId: string) => {
        const event = new CustomEvent('enemy-hit', { detail: { id: enemyId } });
        window.dispatchEvent(event);
    }, []);

    return (
        <>
            {bullets.map(b => (
                <Bullet
                    key={b.id}
                    startPos={b.pos}
                    direction={b.dir}
                    onHit={handleHitEnemy}
                    onDestroy={() => removeBullet(b.id)}
                />
            ))}
        </>
    );
};
