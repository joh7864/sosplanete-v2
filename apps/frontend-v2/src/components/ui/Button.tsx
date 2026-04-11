import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'mint' | 'peach' | 'rose' | 'sky';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'background-color: var(--accent-primary); color: white; border: none; hover:opacity-0.9;',
    secondary: 'background-color: var(--glass-bg); color: var(--text-primary); border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur); hover:background: rgba(255,255,255,0.6);',
    ghost: 'background: transparent; color: var(--text-primary); hover:background: rgba(0,0,0,0.05);',
    mint: 'background-color: var(--color-mint); color: #2D4A22; border: none; hover:brightness-95;',
    peach: 'background-color: var(--color-peach); color: #4A3022; border: none; hover:brightness-95;',
    rose: 'background-color: var(--color-rose); color: #4A2222; border: none; hover:brightness-95;',
    sky: 'background-color: var(--color-sky); color: #223A4A; border: none; hover:brightness-95;',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  // Convert string styles to Tailwind-like or manual classes if needed, but since I use CSS variables in globals.css, I will use a mix.
  // Actually, I'll use inline styles for the variables part to be safe, or just class names if I define them in globals.css later.
  
  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={
        variant === 'primary' ? { backgroundColor: 'var(--accent-primary)', color: 'white', boxShadow: '0 10px 20px -10px rgba(64, 145, 108, 0.4)' } :
        variant === 'mint' ? { backgroundColor: 'var(--color-mint)', color: 'var(--color-forest)' } :
        variant === 'peach' ? { backgroundColor: 'var(--color-peach)', color: '#4A3022' } :
        variant === 'sky' ? { backgroundColor: 'var(--color-sky)', color: '#223A4A' } :
        variant === 'secondary' ? { background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' } :
        {}
      }
      {...props}
    >
      {children}
    </button>
  );
};
