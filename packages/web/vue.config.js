module.exports = {
  configureWebpack: {
    devServer: {
      proxy: {
        "/api": {
          target: "http:localhost:9999",
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
};
