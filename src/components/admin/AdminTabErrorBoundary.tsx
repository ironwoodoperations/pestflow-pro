import React from 'react'

interface State { hasError: boolean; error: string }

export class AdminTabErrorBoundary extends React.Component<
  { tabName: string; children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('Admin tab error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-500 font-medium mb-2">
            Failed to load {this.props.tabName}
          </p>
          <p className="text-gray-400 text-sm mb-4">{this.state.error}</p>
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded text-sm"
            onClick={() => this.setState({ hasError: false, error: '' })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
