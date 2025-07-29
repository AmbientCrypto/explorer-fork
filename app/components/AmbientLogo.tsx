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
                alignItems: 'center',
                display: 'flex',
                gap: '8px',
                height: height || 22,
                width: width || 214,
            }}
        >
            {/* Circular logo with rings */}
            <div
                style={{ 
                    backgroundColor: 'rgb(30, 36, 35)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    flexShrink: 0,
                    height: logoSize,
                    overflow: 'hidden',
                    width: logoSize,
                }}
            >
                <iframe
                    src="https://ambient.xyz/logo"
                    width={400}
                    height={400}
                    style={{
                        background: 'rgb(30, 36, 35)',
                        border: 'none',
                        display: 'block',
                        filter: 'brightness(0.555) contrast(6.5) invert(1) hue-rotate(240deg)',
                        overflow: 'hidden',
                        transform: `scale(${logoSize / 400})`,
                        transformOrigin: 'top left',
                    }}
                    title="Ambient Logo"
                    scrolling="no"
                    frameBorder="0"
                />
            </div>
            
            {/* Ambient text with blue gradient */}
            <span
                style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    background: 'linear-gradient(135deg, #4A90E2 0%, #7BB3F0 50%, #A8D0F8 100%)',
                    backgroundClip: 'text',
                    fontFamily: 'var(--font-geist-sans)',
                    fontOpticalSizing: 'auto',
                    fontSize: `${Math.max(logoSize * 0.8, 16)}px`,
                    fontWeight: '500',
                    letterSpacing: '0.5px',
                }}
            >
                Ambient
            </span>
        </div>
    );
}
