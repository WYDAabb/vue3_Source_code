const obj = { foo: 1 }
const p = new Proxy(obj, {
    deleteProperty(target, key) {
        return Reflect.defineProperty(target, key)
    }
})

console.log(p.foo);
delete p.foo //实际调用 deleteProperty这个操作符
console.log(p.foo); //未定义