import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/init.ts',
            name: 'LeadLooprTracker',
            fileName: 'leadloopr-tracker',
            formats: ['iife'],
        },
        minify: true,
        sourcemap: true,
        rollupOptions: {
            output: {
                extend: true,
                globals: {
                    // Add any global dependencies here if needed
                },
            },
        },
    },
}); 