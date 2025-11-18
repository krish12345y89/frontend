import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
	plugins: [react()],
	resolve: {
		alias: {
			// Ensure single React instance used by resolving to this project's node_modules
			react: path.resolve(__dirname, 'node_modules/react'),
			'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
		}
	},
	optimizeDeps: {
		include: ['react', 'react-dom']
	},
	server: {
		port: 5173,
		proxy: {
			'/admin': {
				target: 'http://localhost:5000',
				changeOrigin: true,
				secure: false
			},
			'/v1': {
				target: 'http://localhost:5000',
				changeOrigin: true,
				secure: false
			},
			'/nosana': {
				target: 'http://localhost:5000',
				changeOrigin: true,
				secure: false
			}
		}
	}
}))
