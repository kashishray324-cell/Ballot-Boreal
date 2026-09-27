import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('voter workspace', () => {
  it('renders the disclosure-first voter journey with a persistent wallet action', () => { render(<App />); expect(screen.getByRole('heading', { name: 'See exactly what leaves your device.' })).toBeInTheDocument(); expect(screen.getByText('Stays on your device')).toBeInTheDocument(); expect(screen.getByText('Local privacy preflight')).toBeInTheDocument(); expect(screen.getByText('3/3')).toBeInTheDocument(); expect(screen.getAllByRole('button', { name: /connect 1am/i }).length).toBeGreaterThan(0) })
})
