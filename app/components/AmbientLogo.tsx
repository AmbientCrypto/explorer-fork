'use client';

import React from 'react';

interface AmbientLogoProps {
    width?: number;
    height?: number;
    className?: string;
}

export function AmbientLogo({ width = 214, height = 22, className = '' }: AmbientLogoProps) {
    const logoSize = (height || 22) * 1.5; // Increase size by 1.5x
    
    return (
        <div 
            className={`${className}`} 
            style={{ 
                width: width || 214,
                height: height || 22,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            {/* Circular logo with rings */}
            <div
                style={{ 
                    width: logoSize,
                    height: logoSize,
                    display: 'inline-block',
                    overflow: 'hidden',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(30, 36, 35)',
                    flexShrink: 0,
                }}
            >
                <iframe
                    src="https://ambient.xyz/logo"
                    width={400}
                    height={400}
                    style={{
                        border: 'none',
                        background: 'rgb(30, 36, 35)',
                        overflow: 'hidden',
                        display: 'block',
                        transform: `scale(${logoSize / 400})`,
                        transformOrigin: 'top left',
                        filter: 'brightness(0.555) contrast(6.5) invert(1) hue-rotate(240deg)',
                    }}
                    title="Ambient Logo"
                    scrolling="no"
                    frameBorder="0"
                />
            </div>
            
            {/* Ambient text with blue gradient */}
            <span
                style={{
                    fontSize: `${Math.max(logoSize * 0.8, 16)}px`,
                    fontFamily: 'var(--font-geist-sans)',
                    fontOpticalSizing: 'auto',
                    fontWeight: '500',
                    background: 'linear-gradient(135deg, #4A90E2 0%, #7BB3F0 50%, #A8D0F8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.5px',
                }}
            >
                Ambient
            </span>
        </div>
    );
}
