module.exports = {
    // 继承 Eslint 规则
    extends: [],
    env: {
        node: true, // 启用node中全局变量
        browser: true, // 启用浏览器中全局变量
    },
    parserOptions: {
        ecmaVersion: 6, //ecm版本
        sourceType: "module", //esmodule
    },
    rules: {
        "no-var": 2, // 不能使用 var 定义变量
        'default-case': [
            'warn', // 要求 switch 语句中有 default 分支，否则警告
            { commentPattern: '^no default$' } // 允许在最后注释 no default, 就不会有警告了
        ],
    },
};
