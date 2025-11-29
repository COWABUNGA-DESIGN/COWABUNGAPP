import('./dist/index.js').catch(err => {
  console.error('Failed to load dist/index.js:', err);
  process.exit(1);
});