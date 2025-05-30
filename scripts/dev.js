#!/usr/bin/env node

/**
 * dev.js
 * Task Master CLI - AI-driven development task management
 *
 * This is the refactored entry point that uses the modular architecture.
 * It imports functionality from the modules directory and provides a CLI.
 */

// Add dotenv config at the very beginning of the file
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name to resolve paths correctly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv to look for .env in the project root (parent directory)
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Add debug logging to check if the API key is loaded (will be masked for security)
if (process.env.ANTHROPIC_API_KEY) {
	const maskedKey = process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' + 
		(process.env.ANTHROPIC_API_KEY.length > 14 ? process.env.ANTHROPIC_API_KEY.slice(-4) : '');
	console.log('API Key loaded successfully:', maskedKey);
} else {
	console.error('No ANTHROPIC_API_KEY found in environment variables');
}

// Debug logging if enabled
if (process.env.DEBUG === '1') {
	console.error('DEBUG - dev.js received args:', process.argv.slice(2));
}

import { runCLI } from './modules/commands.js';

// Run the CLI with the process arguments
runCLI(process.argv);
