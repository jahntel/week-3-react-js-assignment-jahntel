import TaskManager from '../components/TaskManager';

const Tasks = () => (
  <div>
    <h1 className="text-3xl font-bold mb-6">Task Management</h1>
    <p className="text-gray-600 dark:text-gray-300 mb-6">
      Manage your daily tasks with our intuitive task manager. Add, complete, and organize your todos with ease.
    </p>
    <TaskManager />
  </div>
);

export default Tasks;