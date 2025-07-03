import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded p-2 w-full mb-4 dark:bg-gray-700"
        placeholder="Search posts..."
      />
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPosts.map(post => (
          <Card key={post.id}>
            <h2 className="text-lg font-semibold">{post.title}</h2>
            <p className="text-gray-600 dark:text-gray-300">{post.body}</p>
          </Card>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <Button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <Button onClick={() => setPage(prev => prev + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default Posts;
