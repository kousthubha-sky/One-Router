import { render, screen } from '@testing-library/react'

import { BentoGrid } from '../bento-grid'

const mockItems = [
  {
    title: 'Test Item',
    meta: 'Test Meta',
    description: 'Test Description',
    icon: <span>Icon</span>,
    status: 'Active',
    tags: ['Tag1'],
  },
]

describe('BentoGrid', () => {
  it('renders items correctly', () => {
    render(<BentoGrid items={mockItems} />)
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.getByText('Test Meta')).toBeInTheDocument()
  })
})