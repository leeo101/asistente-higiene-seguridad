import React, { useRef, useEffect } from 'react';

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

// Generate static stars once at module load
const shadowsSmall  = generateStars(700);
const shadowsMedium = generateStars(200);
const shadowsLarge  = generateStars(100);

/**
 * Parallax starry background.
 * Wrapper divs receive the mouse-parallax transform.
 * Inner star divs keep their CSS scroll animations untouched.
 */
export default function StarryBackground() {
    const containerRef = useRef(null);
    const wrap1 = useRef(null);
    const wrap2 = useRef(null);
    const wrap3 = useRef(null);
    const rafRef  = useRef(null);
    const target  = useRef({ x: 0, y: 0 });
    const current = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const lerp = (a, b, t) => a + (b - a) * t;

        // Animate loop — smooth interpolation towards target
        const tick = () => {
            current.current.x = lerp(current.current.x, target.current.x, 0.055);
            current.current.y = lerp(current.current.y, target.current.y, 0.055);

            const nx = current.current.x; // -1 … +1
            const ny = current.current.y;

            // Each wrapper moves at a different depth
            if (wrap1.current) wrap1.current.style.transform = `translate(${nx * 20}px, ${ny * 20}px)`;
            if (wrap2.current) wrap2.current.style.transform = `translate(${nx * 36}px, ${ny * 36}px)`;
            if (wrap3.current) wrap3.current.style.transform = `translate(${nx * 56}px, ${ny * 56}px)`;

            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        // Compute normalized offset from container center
        const updateTarget = (clientX, clientY) => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width  / 2;
            const cy = rect.top  + rect.height / 2;
            target.current.x = Math.max(-1, Math.min(1, (clientX - cx) / (rect.width  / 2)));
            target.current.y = Math.max(-1, Math.min(1, (clientY - cy) / (rect.height / 2)));
        };

        const onMouseMove  = (e) => updateTarget(e.clientX, e.clientY);
        const onTouchMove  = (e) => e.touches.length && updateTarget(e.touches[0].clientX, e.touches[0].clientY);
        const resetTarget  = () => { target.current.x = 0; target.current.y = 0; };

        // Listen on window so we catch the mouse even outside the container
        window.addEventListener('mousemove',   onMouseMove, { passive: true });
        window.addEventListener('mouseleave',  resetTarget,  { passive: true });

        const el = containerRef.current;
        if (el) {
            el.addEventListener('touchmove', onTouchMove, { passive: true });
            el.addEventListener('touchend',  resetTarget,  { passive: true });
        }

        // Gyroscope (Android no-permission needed)
        const onOrientation = (e) => {
            if (e.gamma == null || e.beta == null) return;
            target.current.x = Math.max(-1, Math.min(1, e.gamma / 25));
            target.current.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
        };
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission !== 'function') {
            window.addEventListener('deviceorientation', onOrientation, { passive: true });
        }

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('mousemove',        onMouseMove);
            window.removeEventListener('mouseleave',       resetTarget);
            window.removeEventListener('deviceorientation', onOrientation);
            if (el) {
                el.removeEventListener('touchmove', onTouchMove);
                el.removeEventListener('touchend',  resetTarget);
            }
        };
    }, []);

    // Wrapper style: full-size, GPU composited, parallax applied here
    const wrapStyle = {
        position: 'absolute',
        inset: 0,
        willChange: 'transform',
    };

    return (
        <div className="stars-container" ref={containerRef}>

            {/* Layer 1 — small/far stars */}
            <div ref={wrap1} style={wrapStyle}>
                <div className="stars"  style={{ boxShadow: shadowsSmall }} />
                <div className="stars"  style={{ boxShadow: shadowsSmall, transform: 'translateY(-2000px)' }} />
            </div>

            {/* Layer 2 — medium stars */}
            <div ref={wrap2} style={wrapStyle}>
                <div className="stars2" style={{ boxShadow: shadowsMedium }} />
                <div className="stars2" style={{ boxShadow: shadowsMedium, transform: 'translateY(-2000px)' }} />
            </div>

            {/* Layer 3 — large/close stars */}
            <div ref={wrap3} style={wrapStyle}>
                <div className="stars3" style={{ boxShadow: shadowsLarge }} />
                <div className="stars3" style={{ boxShadow: shadowsLarge, transform: 'translateY(-2000px)' }} />
            </div>

            {/* Glowing orbs */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at top right, rgba(255,255,255,0.05) 0%, transparent 60%)', pointerEvents:'none', zIndex:1 }} />
            <div className="hero-orb-right" style={{ zIndex:1, opacity:0.6 }} />
            <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(37,99,235,0.1)', pointerEvents:'none', zIndex:1 }} />
            <div style={{ position:'absolute', bottom:'-60px', left:'60px', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(37,99,235,0.15)', pointerEvents:'none', zIndex:1 }} />

            {/* Shooting star */}
            <div className="shooting-star" />
        </div>
    );
}
