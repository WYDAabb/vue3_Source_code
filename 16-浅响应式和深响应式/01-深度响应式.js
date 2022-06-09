function reactive(obj) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            //代理对象可以通过raw属性访问原始数据
            if (key === 'raw') {
                return target
            }
            track(target, key)
            //得到原始执行结果
            const res = Reflect.get(target, key, receiver);
            //调用reactive将结果包装成响应式数据并返回
            if (typeof res === 'object' && res !== null) {
                //  调用reactive将结果包装成响应式数据并返回
                return reactive(res)
            }
            return res
        }
    })
}