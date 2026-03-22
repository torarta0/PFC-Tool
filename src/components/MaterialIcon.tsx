import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

export const MaterialIcon: React.FC<IconProps> = ({ name, className, ...props }) => {
  return (
    <span className={`material-symbols-outlined ${className}`} {...props as any}>
      {name}
    </span>
  );
};
