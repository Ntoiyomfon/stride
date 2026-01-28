/**
 * Jest Test Setup
 * 
 * This file runs before all tests and sets up the testing environment.
 */

// Extend Jest matchers
import '@testing-library/jest-dom'

// Set up environment variables for testing
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test'
}

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only show errors that aren't expected test errors
    if (!args[0]?.toString().includes('Warning:') && 
        !args[0]?.toString().includes('act(')) {
      originalConsoleError(...args)
    }
  }
  
  console.warn = (...args: any[]) => {
    // Only show warnings that aren't expected test warnings
    if (!args[0]?.toString().includes('Warning:')) {
      originalConsoleWarn(...args)
    }
  }
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})