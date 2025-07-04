import { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Button from './Button';
import Card from './Card';

const TaskManager = () => {
  const [tasks, setTasks] = useLocalStorage('tasks', []);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Task Manager</h2>
      <form onSubmit={addTask} className="mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="border rounded p-2 w-full mb-2 dark:bg-gray-700"
          placeholder="Add a new task"
        />
        <Button type="submit">Add Task</Button>
      </form>
      <div className="flex space-x-2 mb-4">
        {['all', 'active', 'completed'].map(f => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>
      <ul className="space-y-2">
        {filteredTasks.map(task => (
          <li key={task.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="mr-2"
              />
              <span className={task.completed ? 'line-through' : ''}>{task.text}</span>
            </div>
            <Button variant="danger" onClick={() => deleteTask(task.id)}>Delete</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default TaskManager;
