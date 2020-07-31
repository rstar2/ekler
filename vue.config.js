const DumpVueEnvVarsWebpackPlugin = require('./DumpVueEnvVarsWebpackPlugin');

module.exports = {
  transpileDependencies: ['vuetify'],
  pwa: {
    // NOTE: match these with the ones written in 'public/manifest.json'
    // These are for Apple iOS
    name: 'My App',
    themeColor: '#FFFFFF',
    msTileColor: '#AAAAAA',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',

    // configure the workbox plugin
    // NOTE: See https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin#which_plugin_to_use
    // Use GenerateSW if:
    //     1.You want to precache files.
    //     2.You have simple runtime configuration needs (e.g. the configuration allows you to define routes and strategies).
    //     3.You DON'T want to use other Service Worker features (i.e. Web Push).
    //     4.You DON'T want to import additional scripts or add additional logic.
    // So 'InjectManifest' gives much more control
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swSrc: 'src/service-worker.js'
      // ...other Workbox options...
    }
  },
  configureWebpack: {
    plugins: [
      // dump/export the env variables
      new DumpVueEnvVarsWebpackPlugin({ filename: 'service-worker-env.js' })
    ]
  }
};
