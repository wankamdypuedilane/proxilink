import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <main>
      <h1>Page introuvable</h1>
      <p>La page demandée n’existe pas.</p>
      <Link to="/">Retour à l’accueil</Link>
    </main>
  )
}

export default NotFoundPage
