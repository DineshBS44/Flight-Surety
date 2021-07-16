const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // to resolve errors in HtmlWebPack plugin
const HtmlWebpackPlugin = require("html-webpack-plugin");

const path = require("path");

module.exports = {
  entry: ["babel-polyfill", path.join(__dirname, "src/dapp")],
  output: {
    path: path.join(__dirname, "prod/dapp"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|gif)$/i,
        use: ["file-loader"],
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // to resolve errors in HtmlWebPack plugin with the webpack
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src/dapp/index.ejs"),
    }),
  ],
  devtool: "inline-source-map",
  resolve: {
    extensions: [".js"],
  },
  devServer: {
    contentBase: path.join(__dirname, "dapp"),
    port: 8000,
    stats: "minimal",
  },
};
