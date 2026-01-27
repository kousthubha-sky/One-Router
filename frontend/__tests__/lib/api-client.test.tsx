import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useClientApiCall, useGenerateAPIKey, useGetAPIKeys } from '@/lib/api-client'

// Mock Clerk's useAuth hook
const mockGetToken = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
  }),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useClientApiCall', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('should include authorization header with token', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'csrf123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

    const { result } = renderHook(() => useClientApiCall())

    await result.current('/test-endpoint', { method: 'POST' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    )
  })

  it('should fetch CSRF token for POST requests', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'csrf123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    const { result } = renderHook(() => useClientApiCall())

    await result.current('/api/test', { method: 'POST' })

    // First call should be for CSRF token
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/csrf/token'),
      expect.any(Object)
    )
  })

  it('should throw error for non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        get: () => 'application/json',
      },
      json: () => Promise.resolve({ detail: 'Invalid token' }),
    })

    const { result } = renderHook(() => useClientApiCall())

    await expect(result.current('/test')).rejects.toThrow('API Error: 401')
  })

  it('should return JSON data for successful response', async () => {
    const mockData = { id: '123', name: 'test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { result } = renderHook(() => useClientApiCall())
    const data = await result.current('/test')

    expect(data).toEqual(mockData)
  })
})

describe('useGenerateAPIKey', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('should call POST /api/keys', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ csrf_token: 'csrf123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ key: 'unf_test_xxx' }),
      })

    const { result } = renderHook(() => useGenerateAPIKey())
    await result.current()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/keys'),
      expect.objectContaining({
        method: 'POST',
      })
    )
  })
})

describe('useGetAPIKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockResolvedValue('mock-token')
  })

  it('should call GET /api/keys', async () => {
    const mockKeys = [
      { id: '1', key_prefix: 'unf_test_xxx' },
      { id: '2', key_prefix: 'unf_live_yyy' },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockKeys),
    })

    const { result } = renderHook(() => useGetAPIKeys())
    const keys = await result.current()

    expect(keys).toEqual(mockKeys)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/keys'),
      expect.not.objectContaining({
        method: 'POST',
      })
    )
  })
})
