module.exports = {
  presets: [
    [
      "@vue/app",
      {
        useBuiltIns: "entry",
        modules: false
      }
    ]
  ],
  plugins: [
    [
      "transform-imports",
      {
        vuetify: {
          transform: "vuetify/es5/components/${member}",
          preventFullImport: true
        }
      }
    ]
  ]
};
