import { useState, useEffect } from 'react';
import recipies from '../components/recipes';
import { getAllBooks } from '../services/recipeServices';

function HomePage() {
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getAllBooks()
      .then(data => {
        setBooks(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load data. Is the backend running?');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Book Club</h1>
      {books.map(book => (
        <BookCard key={book.id} title={book.title} author={book.author} />
      ))}
    </div>
  );
}

export default HomePage;