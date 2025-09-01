# LeadLoopr Tracker

This package contains the client-side tracking script for LeadLoopr. It's designed to be injected via Google Tag Manager (GTM) into any website.

## Development

```bash
# Install dependencies
pnpm install

# Start development mode with watch
pnpm dev

# Build for production
pnpm build
```

## Integration

### Via Google Tag Manager

1. Create a new Custom HTML tag in GTM
2. Add the following code:

```html
<script src="https://cdn.leadloopr.com/leadloopr-tracker.js"></script>
<script>
  LeadLooprTracker.init();
</script>
```

### Debug Mode

To enable debug mode, add the following before the tracker script:

```html
<script>
  window.LEADLOOPR_DEBUG = true;
</script>
```

## Building

The build process uses Vite to create a minified, browser-compatible IIFE bundle. The output file will be available at `dist/leadloopr-tracker.js`.

## TypeScript

This package is written in TypeScript and includes type definitions. The build process will generate both the JavaScript bundle and corresponding type definitions. 