const path = require('node:path');

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    extensions: ['.ts', '.js', '.json'],
    alias: {
      ...(options.resolve?.alias ?? {}),
      '@app/common': path.resolve(__dirname, 'libs/common/src'),
      '@app/contracts': path.resolve(__dirname, 'libs/contracts/src'),
    },
  },
});
