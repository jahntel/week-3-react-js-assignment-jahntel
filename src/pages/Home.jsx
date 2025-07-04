import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

const Home = () => (
  <div>
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold mb-4">Welcome to React Assignment App</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        A modern React application built with Vite and Tailwind CSS
      </p>
      <div className="flex gap-4 justify-center">
        <Link to="/tasks">
          <Button variant="primary">Manage Tasks</Button>
        </Link>
        <Link to="/posts">
          <Button variant="secondary">View Posts</Button>
        </Link>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <h3 className="text-xl font-semibold mb-2">📝 Task Management</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Create, organize, and track your daily tasks with our intuitive task manager.
        </p>
      </Card>
      
      <Card>
        <h3 className="text-xl font-semibold mb-2">📊 API Integration</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Browse posts fetched from JSONPlaceholder with pagination and search functionality.
        </p>
      </Card>
      
      <Card>
        <h3 className="text-xl font-semibold mb-2">🌙 Theme Switching</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Toggle between light and dark themes for a comfortable viewing experience.
        </p>
      </Card>
    </div>

    <div className="mt-12 text-center">
      <h2 className="text-2xl font-bold mb-4">Features Implemented</h2>
      <div className="text-left max-w-2xl mx-auto">
        <ul className="space-y-2 text-gray-600 dark:text-gray-300">
          <li>✅ React with Vite and Tailwind CSS</li>
          <li>✅ Reusable UI Components (Button, Card, Navbar, Footer)</li>
          <li>✅ State Management with React Hooks</li>
          <li>✅ Custom Hook for localStorage</li>
          <li>✅ Context API for Theme Management</li>
          <li>✅ API Integration with Loading States</li>
          <li>✅ Responsive Design</li>
          <li>✅ Dark/Light Mode Toggle</li>
        </ul>
      </div>
    </div>
  </div>
);

export default Home;
