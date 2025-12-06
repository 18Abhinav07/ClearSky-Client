import React from 'react';

interface CloudProps {
  className?: string;
  style?: React.CSSProperties;
}

const Cloud: React.FC<CloudProps> = ({ className, style }) => {
  return (
    <div
      className={`absolute z-0 select-none ${className} bg-soft-cyan`}
      style={style}
    >
      <img
        src="/cloud.png"
        alt="Decorative cloud"
        className="w-full h-auto mix-blend-multiply"
      />
    </div>
  );
};

export default Cloud;
