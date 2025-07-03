import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();

  return (
    <nav className="bg-gray-200 dark:bg-gray-700 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="space-x-4">
          <Link to="/" className={`hover:text-blue-500 ${location.pathname === '/' ? 'text-blue-500' : ''}`}>
            Home
          </Link>
          <Link to="/posts" className={`hover:text-blue-500 ${location.pathname === '/posts' ? 'text-blue-500' : ''}`}>
            Posts
          </Link>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-300 dark:bg-gray-600"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
