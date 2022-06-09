
//封装createReactive函数 接收一个参数isShallow 代表是否为浅相应默认为false 既非浅相应
function createReactive(obj, isShallow = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            //代理对象可以通过raw属性访问原始数据
            if (key === 'raw') {
                return target
            }
            track(target, key)
            //得到原始执行结果
            const res = Reflect.get(target, key, receiver);
            //如果是浅相应就返回结果 不用调用reactive去递归响应式
            if (isShallow) {
                return res
            }

            if (typeof res === 'object' && res !== null) {
                //  调用reactive将结果包装成响应式数据并返回
                return reactive(res)
            }
            return res
        }
    })
}

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