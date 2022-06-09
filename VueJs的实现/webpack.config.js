const path = require('path');
const ESLintWebpackPlugin = require("eslint-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    // 入口
    entry: "./src/index.js",
    // 输出
    output: {
        path: undefined,
        filename: "index.js",
        clean: true,
    },
    //开发服务器
    devServer: {
        host: 'localhost',
        port: '8088',
        open: true,
        hot: true,// 开启HMR功能（只能用于开发环境，生产环境不需要了）
    },
    // 加载器
    module: {
        rules: [
            {
                test: /\.m?js$/,  //正则匹配
                // exclude: /node_modules/, //排除node_modules中的js文件 （这些文件不进行处理）
                include: path.resolve(__dirname, './src'),  //只是处理src下面的文件 其他文件不做处理
                loader: 'babel-loader',
                //这里也支持写预设
                options: {
                    // presets: ['@babel/preset-env']
                    cacheDirectory: true, // 开启babel编译缓存
                    cacheCompression: false, // 缓存文件不要压缩
                }
            }
        ],
    },
    // 插件
    plugins: [
        new ESLintWebpackPlugin({
            // 指定检查文件的根目录
            context: path.resolve(__dirname, "./src"),
            exclude: "node_modules", // 默认值
            // 缓存目录
            cacheLocation: path.resolve(__dirname, "../node_modules/.cache/.eslintcache"),
        }),
        new HtmlWebpackPlugin({
            // 以 public/index.html 为模板创建文件
            // 新的html文件有两个特点：1. 内容和源文件一致 2. 自动引入打包生成的js等资源
            template: path.resolve(__dirname, "public/index.html"),
            title: 'vue3设计与实现'
        })
    ],
    // 模式
    mode: "development",
    //映射
    devtool: "cheap-module-source-map"
}