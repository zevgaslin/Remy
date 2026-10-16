import { Link } from 'react-router';

function NotFoundPage() {
  return (
    <section className="home-intro">
      <h1>Page not found</h1>
      <p>
        That page doesn’t exist. <Link to="/">Go back home</Link>.
      </p>
    </section>
  );
}

export default NotFoundPage;
