import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('voter workspace', () => {
  it('renders the disclosure-first voter journey', () => { render(<App />); expect(screen.getByRole('heading', { name: 'See exactly what leaves your device.' })).toBeInTheDocument(); expect(screen.getByText('Stays on your device')).toBeInTheDocument() })
})
