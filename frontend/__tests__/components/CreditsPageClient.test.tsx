import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreditsPageClient } from '@/components/CreditsPageClient'

// Mock Clerk's useAuth hook
const mockGetToken = jest.fn().mockResolvedValue('mock-token')
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
  }),
}))

// Mock CreditBalance component
jest.mock('@/components/CreditBalance', () => ({
  CreditBalance: () => <div data-testid="credit-balance">1000 credits</div>,
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('CreditsPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })

  it('renders pricing plans', () => {
    render(<CreditsPageClient />)

    // Should show all three plans
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('shows credit amounts for each plan', () => {
    render(<CreditsPageClient />)

    // Check credit amounts are present (may appear multiple times due to formatting)
    expect(screen.getAllByText(/1,000/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/10,000/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/100,000/).length).toBeGreaterThan(0)
  })

  it('shows INR prices for each plan', () => {
    render(<CreditsPageClient />)

    // Check prices are displayed (no comma formatting in prices)
    expect(screen.getByText(/₹100/)).toBeInTheDocument()
    expect(screen.getByText(/₹800/)).toBeInTheDocument()
    expect(screen.getByText(/₹7000/)).toBeInTheDocument()
  })

  it('has buy buttons for each plan', () => {
    render(<CreditsPageClient />)

    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    expect(buyButtons).toHaveLength(3)
  })

  it('displays the CreditBalance component', () => {
    render(<CreditsPageClient />)

    expect(screen.getByTestId('credit-balance')).toBeInTheDocument()
  })

  it('shows plan descriptions', () => {
    render(<CreditsPageClient />)

    expect(screen.getByText(/Perfect for testing/i)).toBeInTheDocument()
    expect(screen.getByText(/Best for growing/i)).toBeInTheDocument()
    expect(screen.getByText(/High-volume/i)).toBeInTheDocument()
  })
})
