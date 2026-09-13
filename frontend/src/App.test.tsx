import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Routage de l’application', () => {
  it('affiche la page d’accueil sur la route principale', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'ProxiLink' })).toBeInTheDocument()
    expect(
      screen.getByText('Trouvez facilement des services de proximité à Brest.'),
    ).toBeInTheDocument()
  })

  it('affiche la page introuvable et permet de revenir à l’accueil', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/adresse-inconnue']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Retour à l’accueil' }))

    expect(screen.getByRole('heading', { name: 'ProxiLink' })).toBeInTheDocument()
  })
})
