import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { RazorpaySetup } from '@/components/RazorpaySetup'

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue('token') }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

jest.mock('lucide-react', () => ({
  Loader2: () => null,
  CheckCircle2: () => null,
  AlertCircle: () => null,
  Shield: () => null,
  Zap: () => null,
}))

describe('RazorpaySetup', () => {
  const mockApiClient = jest.fn().mockResolvedValue({
    success: true,
    test: { configured: false, verified: false, key_prefix: null },
    live: { configured: false, verified: false, key_prefix: null },
    active_environment: 'test',
  })

  it('renders without crashing', async () => {
    render(<RazorpaySetup apiClient={mockApiClient} />)
    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalled()
    })
  })

  it('calls API to load status on mount', async () => {
    render(<RazorpaySetup apiClient={mockApiClient} />)
    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith('/api/razorpay/status')
    })
  })
})
