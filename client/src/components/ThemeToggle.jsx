import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      className="btn btn--ghost btn--small" 
      aria-label="Toggle theme"
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
};
