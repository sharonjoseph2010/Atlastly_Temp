import React from 'react';

const VendorMarker = React.memo(({ vendor, state = 'confirmed', onClick, isSelected }) => {
  const stateColors = {
    pending: {
      bg: '#FFA500',
      border: '#FF8C00',
      text: '#FFFFFF'
    },
    confirmed: {
      bg: '#001F3F',
      border: '#000000',
      text: '#FFFFFF'
    },
    locked: {
      bg: '#85144b',
      border: '#65102F',
      text: '#FFFFFF'
    }
  };

  const colors = stateColors[state];
  const scale = isSelected ? 1.2 : 1;

  return (
    <div
      onClick={onClick}
      className="vendor-marker"
      style={{
        position: 'absolute',
        transform: `translate(-50%, -100%) scale(${scale})`,
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        zIndex: isSelected ? 1000 : 1,
      }}
      data-testid={`marker-${vendor.vendor_id}`}
    >
      {/* Marker Pin */}
      <svg
        width="40"
        height="50"
        viewBox="0 0 40 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}
      >
        {/* Pin Shape */}
        <path
          d="M20 0C10 0 2 8 2 18C2 28 20 50 20 50C20 50 38 28 38 18C38 8 30 0 20 0Z"
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth="2"
        />
        
        {/* Inner Circle */}
        <circle
          cx="20"
          cy="18"
          r="8"
          fill={colors.text}
          opacity="0.9"
        />
        
        {/* Category Initial */}
        <text
          x="20"
          y="22"
          fontSize="10"
          fontWeight="bold"
          fill={colors.bg}
          textAnchor="middle"
        >
          {vendor.category.charAt(0)}
        </text>
      </svg>

      {/* Label on hover/selection */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: '55px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '2px solid #001F3F',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#001F3F',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {vendor.business_name}
        </div>
      )}
    </div>
  );
});

VendorMarker.displayName = 'VendorMarker';

export default VendorMarker;