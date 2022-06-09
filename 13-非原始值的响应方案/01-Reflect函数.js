/* const obj = { foo: '1' }
//直接读取 
console.log(obj.foo);
console.log(Reflect.get(obj, 'foo')); */

const obj = {
    get foo() {
        return this;
    }
}

console.log(Reflect.get(obj, 'foo', { demo: 2 }));