import React, { useMemo } from 'react';

/**
 * Generates a parallax 3D starry night background.
 */
export default function StarryBackground() {
    // Generate random box-shadow strings for stars
    const generateStars = (count) => {
        let stars = '';
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * 2000);
            const y = Math.floor(Math.random() * 2000);
            const opacity = Math.random() * 0.5 + 0.3;
            stars += `${x}px ${y}px rgba(255, 255, 255, ${opacity})${i === count - 1 ? '' : ', '}`;
        }
        return stars;
    };

    const shadowsSmall = useMemo(() => generateStars(700), []);
    const shadowsMedium = useMemo(() => generateStars(200), []);
    const shadowsLarge = useMemo(() => generateStars(100), []);

    return (
        <div className="stars-container">
            {/* Layer 1 - Slow, small stars */}
            <div className="stars" style={{ boxShadow: shadowsSmall }} />
            <div className="stars" style={{ boxShadow: shadowsSmall, transform: 'translateY(-2000px)' }} />

            {/* Layer 2 - Medium speed, medium stars */}
            <div className="stars2" style={{ boxShadow: shadowsMedium }} />
            <div className="stars2" style={{ boxShadow: shadowsMedium, transform: 'translateY(-2000px)' }} />

            {/* Layer 3 - Fast, large stars moving diagonally for a 3D effect */}
            <div className="stars3" style={{ boxShadow: shadowsLarge }} />
            <div className="stars3" style={{ boxShadow: shadowsLarge, transform: 'translateY(-2000px)' }} />

            {/* Original Glowing Orbs for ambiance on top of the night sky */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.05) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 1 }} />
            <div className="hero-orb-right" style={{ zIndex: 1, opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(37,99,235, 0.1)', pointerEvents: 'none', zIndex: 1 }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(37,99,235, 0.15)', pointerEvents: 'none', zIndex: 1 }} />

            {/* Animated Shooting Star */}
            <div className="shooting-star"></div>
        </div>
    );
}
