//1.判断1
const obj = new Proxy(data, {
    //拦截操作设置
    set(target, key, newValue, receiver) {
        const oldValue = target[key];
        //判断变量type 如果属性不存在，说明是在添加属性，否则是设置已有属性
        const type = Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'

        const res = Reflect.set(target, key, newValue, receiver);

        //判断两者不相同的时候 进行trigger触发
        if (oldValue !== newValue) {
            trigger(target, key, type) //将类型传给trigger函数
        }
        return res;
    }
})

//1.判断1有缺陷不能判断 NAN

const obj = new Proxy(data, {
    //拦截操作设置
    set(target, key, newValue, receiver) {
        const oldValue = target[key];
        //判断变量type 如果属性不存在，说明是在添加属性，否则是设置已有属性
        const type = Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'

        const res = Reflect.set(target, key, newValue, receiver);

        //比较新值和旧值，只有当他们不全等，并且都不是NAN的时候才触发相应    NAN === NAN(false)   NAN!==NAN(true) 
        if (oldValue !== newValue && (oldValue === oldValue || newValue === newValue)) {
            trigger(target, key, type) //将类型传给trigger函数
        }
        return res;
    }
})