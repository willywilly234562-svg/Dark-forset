import React from 'react';
import { PlayerClass } from '../types';

interface PlayerAvatarProps {
  playerClass: PlayerClass;
  isAttacking?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ playerClass, isAttacking, className, style }) => {
  if (playerClass === 'SOLDIER') {
    return (
      <svg 
        viewBox="0 0 24 24" 
        className={className} 
        style={style} 
        shapeRendering="crispEdges" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="2" width="8" height="8" fill="#333" />
        <rect x="10" y="4" width="4" height="4" fill="#111" />
        <rect x="11" y="4" width="2" height="6" fill="#111" />
        <rect x="9" y="10" width="6" height="8" fill="#EEE" />
        <rect x="9" y="18" width="2" height="4" fill="#333" />
        <rect x="13" y="18" width="2" height="4" fill="#333" />
        <rect x="4" y="10" width="8" height="10" rx="1" fill="#FFF" />
        <rect x="4" y="10" width="8" height="10" rx="1" fill="none" stroke="#333" strokeWidth="0.5" />
        <path d="M8 11V19 M5 14H11" stroke="#2563EB" strokeWidth="2" />
        <rect x="5" y="11" width="2" height="2" fill="#F59E0B" />
        <rect x="9" y="17" width="2" height="2" fill="#F59E0B" />
        {/* Animated Sword Group */}
        <g 
            className={isAttacking ? 'animate-sword-swing' : ''} 
            style={{ transformOrigin: '17px 18px' }}
        >
            <rect x="16" y="8" width="2" height="10" fill="#9CA3AF" />
            <rect x="15" y="14" width="4" height="2" fill="#F59E0B" />
            <rect x="16" y="16" width="2" height="3" fill="#5D4037" />
        </g>
      </svg>
    );
  }

  if (playerClass === 'DOCTOR') {
    return (
      <svg 
        viewBox="0 0 24 32" 
        className={className} 
        style={style} 
        shapeRendering="crispEdges" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="2" width="8" height="4" fill="#5D4037" />
        <rect x="6" y="4" width="2" height="4" fill="#5D4037" />
        <rect x="16" y="4" width="2" height="2" fill="#5D4037" />
        <rect x="8" y="6" width="8" height="6" fill="#FFCCBC" />
        <rect x="10" y="8" width="2" height="2" fill="#000" />
        <rect x="14" y="8" width="2" height="2" fill="#000" />
        <rect x="6" y="12" width="12" height="14" fill="#F5F5F5" />
        <rect x="4" y="12" width="2" height="8" fill="#F5F5F5" />
        
        <rect x="10" y="12" width="4" height="2" fill="#B3E5FC" />
        <rect x="11" y="14" width="2" height="6" fill="#1E88E5" />
        <rect x="4" y="20" width="2" height="2" fill="#FFCCBC" />
        <rect x="8" y="26" width="2" height="4" fill="#3E2723" />
        <rect x="14" y="26" width="2" height="4" fill="#3E2723" />

        {/* Animated Right Arm */}
        <g className={isAttacking ? 'animate-arm-punch' : ''}>
             <rect x="18" y="12" width="2" height="8" fill="#F5F5F5" />
             <rect x="18" y="20" width="2" height="2" fill="#FFCCBC" />
        </g>
      </svg>
    );
  }

  return <div className="text-4xl">👻</div>;
};

export default PlayerAvatar;
