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

  // copy server files and assets
  config.plugins.push(
    new CopyWebpackPlugin([
      { from: `${__dirname}/src/server.js`, to: '../server.js' },
      { from: `${__dirname}/src/transcode.js`, to: '../transcode.js' },
      { context: `${__dirname}/src/assets`, from: `*.*` }
    ])
  );

  if (config.devServer) {
    config.devServer.proxy = [
      {
        path: '/items.json',
        target: 'http://localhost:3000/items.json'
      },
      {
        path: '/data/**',
        target: 'http://localhost:3000'
      }
    ];
  }

  // Remove loaders to implement own svg loader
  const loader =
    process.env.NODE_ENV === 'production'
      ? helpers.getLoadersByName(config, 'file-loader')
      : helpers.getLoadersByName(config, 'url-loader');

  if (loader.length > 0 && loader[0]['ruleIndex']) {
    config.module.loaders.splice(loader[0]['ruleIndex'], 1);
  }

  config.module.loaders.push(
    {
      test: /\.svg$/,
      use: [
        {
          loader: 'svgr/webpack'
        },
        {
          loader: require.resolve('file-loader'),
          options: {
            name: 'svgs/[name].[hash:8].[ext]'
          }
        }
      ]
    },
    {
      test: /\.(woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm)(\?.*)?$/i,
      loader: 'file-loader'
    }
  );

  let API_URL;

  // Configure demo mode
  if (process.env.PUBLISH_ENV === 'github') {
    API_URL = '/SBideo/items-demo.json';
    config.output.publicPath = '/SBideo/';

    config.plugins.push(
      new CopyWebpackPlugin([
        { context: `${__dirname}/data-clientdemo`, from: `*.*` }
      ])
    );
  }

  config.plugins.push(
    new helpers.webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(API_URL || '/items.json'),
      'process.env.ASSET_PATH': JSON.stringify(config.output.publicPath || '/'),
      'process.env.PUBLISH_ENV': JSON.stringify(process.env.PUBLISH_ENV)
    })
  );
};
