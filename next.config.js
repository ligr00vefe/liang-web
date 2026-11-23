module.exports = (phase) => ({
  distDir: process.env.NETLIFY === 'true' || phase === 'phase-development-server' ? '.next' : '.next-build',
  devIndicators: false
});
