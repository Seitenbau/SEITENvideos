import HtmlWebpackInlineSourcePlugin from 'html-webpack-inline-source-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default (config, env, helpers) => {
  // inline all styles
  const { plugin } =
    helpers.getPluginsByName(config, 'HtmlWebpackPlugin')[0] || {};
  if (plugin) {
    plugin.options.inlineSource = '.(css)$';
  }
  config.plugins.push(new HtmlWebpackInlineSourcePlugin());

  // copy assets
  config.plugins.push(
    new CopyWebpackPlugin([
      { from: `${__dirname}/src/server.js`, to: '../server.js' },
      { from: `${__dirname}/src/transcode.js`, to: '../transcode.js' }
    ])
  );

  if (config.devServer) {
    config.devServer.proxy = [
      {
        path: '/items.json',
        target: 'http://localhost:3000/items.json'
      },
      {
        path: '/octicons/**',
        target: 'http://localhost:3000'
      },
      {
        path: '/data/**',
        target: 'http://localhost:3000'
      }
    ];
  }
};
