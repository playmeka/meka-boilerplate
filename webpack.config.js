const path = require("path");
const nodeExternals = require("webpack-node-externals");
const { lib } = require("serverless-webpack");

module.exports = {
  entry: lib.entries,
  devtool: "source-map",
  mode: lib.webpack.isLocal ? "development" : "production",
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js"
  },
  target: "node"
};
