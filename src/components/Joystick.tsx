import { useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export const Joystick = () => {
    const setControls = useGameStore(state => state.setControls);
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    // Config
    const MAX_RADIUS = 40; // Max distance for stick
    const STICK_SIZE = 40;
    const BASE_SIZE = 100;

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        updatePosition(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        updatePosition(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        setPosition({ x: 0, y: 0 });
        setControls({ moveX: 0, moveY: 0 });
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const updatePosition = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Clamp to radius
        if (distance > MAX_RADIUS) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * MAX_RADIUS;
            dy = Math.sin(angle) * MAX_RADIUS;
        }

        setPosition({ x: dx, y: dy });

        // Normalize output (-1 to 1)
        // Invert Y because screen Y is down, but 3D forward is usually -Z or +Z depending on logic.
        // Usually Joystick Up (Negative Screen Y) -> Forward
        // Joystick Down (Positive Screen Y) -> Backward
        setControls({
            moveX: dx / MAX_RADIUS,
            moveY: dy / MAX_RADIUS
        });
    };

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                width: `${BASE_SIZE}px`,
                height: `${BASE_SIZE}px`,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                position: 'relative',
                touchAction: 'none', // Prevent scrolling
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'auto'
            }}
        >
            {/* Stick */}
            <div style={{
                width: `${STICK_SIZE}px`,
                height: `${STICK_SIZE}px`,
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                transform: `translate(${position.x}px, ${position.y}px)`,
                cursor: 'pointer'
            }} />
        </div>
    );
};
