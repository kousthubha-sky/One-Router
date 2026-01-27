import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GlobalEnvironmentToggle } from '@/components/GlobalEnvironmentToggle'

// Mock Clerk's useAuth hook
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
  }),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader-icon">Loading</span>,
  Zap: () => <span data-testid="zap-icon">Zap</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
}))

describe('GlobalEnvironmentToggle', () => {
  const mockApiClient = jest.fn()
  const mockOnGlobalSwitch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders Test and Live buttons', () => {
    render(
      <GlobalEnvironmentToggle
        services={[]}
        apiClient={mockApiClient}
        onGlobalSwitch={mockOnGlobalSwitch}
      />
    )

    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('shows Test mode as active when all services are in test environment', () => {
    const services = [
      { id: '1', service_name: 'razorpay', environment: 'test' },
      { id: '2', service_name: 'twilio', environment: 'test' },
    ]

    render(
      <GlobalEnvironmentToggle
        services={services}
        apiClient={mockApiClient}
        onGlobalSwitch={mockOnGlobalSwitch}
      />
    )

    // Test button should have active styling (bg-blue-500)
    const testButton = screen.getByText('Test').closest('button')
    expect(testButton).toHaveClass('bg-blue-500')
  })

  it('shows Live mode as active when all services are in live environment', () => {
    const services = [
      { id: '1', service_name: 'razorpay', environment: 'live' },
      { id: '2', service_name: 'twilio', environment: 'live' },
    ]

    render(
      <GlobalEnvironmentToggle
        services={services}
        apiClient={mockApiClient}
        onGlobalSwitch={mockOnGlobalSwitch}
      />
    )

    // Live button should have active styling (bg-green-500)
    const liveButton = screen.getByText('Live').closest('button')
    expect(liveButton).toHaveClass('bg-green-500')
  })

  it('disables buttons when apiClient is not provided', () => {
    render(
      <GlobalEnvironmentToggle
        services={[]}
        onGlobalSwitch={mockOnGlobalSwitch}
      />
    )

    const testButton = screen.getByText('Test').closest('button')
    const liveButton = screen.getByText('Live').closest('button')

    expect(testButton).toBeDisabled()
    expect(liveButton).toBeDisabled()
  })

  it('calls apiClient when switching to test mode', async () => {
    mockApiClient.mockResolvedValue({ success: true })

    const services = [
      { id: '1', service_name: 'razorpay', environment: 'live' },
    ]

    render(
      <GlobalEnvironmentToggle
        services={services}
        apiClient={mockApiClient}
        onGlobalSwitch={mockOnGlobalSwitch}
      />
    )

    const testButton = screen.getByText('Test').closest('button')
    fireEvent.click(testButton!)

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith(
        '/api/services/switch-all-environments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ environment: 'test' }),
        })
      )
    })
  })

  it('checks live readiness before switching to live mode', async () => {
    mockApiClient
      .mockResolvedValueOnce({ can_go_live: true }) // can-go-live check
      .mockResolvedValueOnce({ success: true }) // switch call

    const services = [
      { id: '1', service_name: 'razorpay', environment: 'test' },
    ]

    render(
      <GlobalEnvironmentToggle
        services={services}
        apiClient={mockApiClient}
        onGlobalSwitch={mockOnGlobalSwitch}
      />
    )

    const liveButton = screen.getByText('Live').closest('button')
    fireEvent.click(liveButton!)

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith('/api/razorpay/can-go-live')
    })
  })

  it('shows modal when live credentials are not configured', async () => {
    mockApiClient.mockResolvedValueOnce({ can_go_live: false })

    const services = [
      { id: '1', service_name: 'razorpay', environment: 'test' },
    ]

    render(
      <GlobalEnvironmentToggle
        services={services}
        apiClient={mockApiClient}
        onGlobalSwitch={mockOnGlobalSwitch}
      />
    )

    const liveButton = screen.getByText('Live').closest('button')
    fireEvent.click(liveButton!)

    await waitFor(() => {
      expect(screen.getByText('Live Mode Requires Configuration')).toBeInTheDocument()
    })
  })
})
