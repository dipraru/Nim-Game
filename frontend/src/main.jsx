import React, { Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

class ErrorBoundary extends Component {
	constructor(props) {
		super(props)
		this.state = { error: null }
	}
	static getDerivedStateFromError(error) {
		return { error }
	}
	componentDidCatch(error, info) {
		console.error('Runtime error captured by ErrorBoundary:', error, info)
	}
	render() {
		if (this.state.error) {
			return (
				<div style={{ padding: 24 }}>
					<h2>Something went wrong</h2>
					<pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
				</div>
			)
		}
		return this.props.children
	}
}

createRoot(document.getElementById('root')).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
)
