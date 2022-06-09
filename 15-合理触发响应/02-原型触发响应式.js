


function reactive(obj) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            //代理对象可以通过raw属性访问原始数据
            if (key === 'raw') {
                return target
            }
            track(target, key)

            const res = Reflect.get(target, key, receiver);
            return res
        },
        //拦截操作设置
        set(target, key, newValue, receiver) {
            const oldValue = target[key];
            //判断变量type 如果属性不存在，说明是在添加属性，否则是设置已有属性
            const type = Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'

            const res = Reflect.set(target, key, newValue, receiver);

            //target === receiver.raw 说明receiver就是target的代理对象 解决原型问题
            if (target === receiver.raw) {
                //比较新值和旧值，只有当他们不全等，并且都不是NAN的时候才触发相应    NAN === NAN(false)   NAN!==NAN(true) 
                if (oldValue !== newValue && (oldValue === oldValue || newValue === newValue)) {
                    trigger(target, key, type) //将类型传给trigger函数
                }
            }
            return res;
        }
    })
}