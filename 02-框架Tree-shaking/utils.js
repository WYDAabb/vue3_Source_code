export function foo(obj) {
    obj && obj.foo
}

//bar 函数是dead code 会被tree-shaking 去掉 
export function bar(obj) {
    obj && obj.bar
}