import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'mint' | 'peach' | 'rose' | 'sky' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return { backgroundColor: 'var(--accent-primary)', color: 'white', boxShadow: '0 10px 20px -10px rgba(64, 145, 108, 0.4)' };
      case 'mint': return { backgroundColor: 'var(--color-mint)', color: 'var(--color-forest)' };
      case 'peach': return { backgroundColor: 'var(--color-peach)', color: '#4A3022' };
      case 'sky': return { backgroundColor: 'var(--color-sky)', color: '#223A4A' };
      case 'secondary': return { background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' };
      case 'outline': return { background: 'transparent', border: '2px solid var(--accent-primary)', color: 'var(--accent-primary)' };
      case 'ghost': return { background: 'transparent', color: 'var(--text-primary)' };
      default: return {};
    }
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={getVariantStyles()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
