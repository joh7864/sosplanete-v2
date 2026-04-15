import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingStyles = {
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-10',
  none: '',
};

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', padding = 'md', ...rest }) => {
  return (
    <div className={`glass-card ${paddingStyles[padding]} ${className} transition-smooth`} {...rest}>
      {children}
    </div>
  );
};
