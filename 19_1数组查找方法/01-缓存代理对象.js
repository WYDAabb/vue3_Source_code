export function createReactive(data, isShallow = false, isReadonly = false) {
    return new Proxy(data, {
        get(target, key, receiver) {// receiver 代表代理对象
            //代理对象可以通过raw属性访问原始数据  receiver.raw = target 解决原型引起的 多次调用effect[[set]]方法的问题
            if (key === 'raw') {
                return target
            }

            //判断操作是否是数组 并且key是我们定义的数组方法 arrayInstrumentations中的
            //返回定义在arrayInstrumentations上的值
            if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
                return Reflect.get(arrayInstrumentations, key, receiver)
            }

            // 非只读的时候 才建立收集依赖 要不只读的时候浪费性能 只读肯定不是响应式 因为不能修改
            if (!isReadonly && typeof key !== 'symbol') { //key不是symbol才会追踪
                track(target, key);
            }

            const res = Reflect.get(target, key, receiver);

            //浅响应 直接返回
            if (isShallow) {
                return res
            }

            //深度响应式
            if (typeof res === 'object' && res !== null) {
                return isReadonly ? readonly(res) : reactive(res) //调用reactive 将结果包装成响应式数据并返回
            }
            return res
        },
        set(target, key, newValue, receiver) {
            if (isReadonly) {
                console.warn(`属性${key}是只读的`);
                return true //只读属性返回出去
            }
            const oldValue = target[key];
            //判断属性是否存在 如果存在的话那么就是设置 不存在就是添加
            const type = Array.isArray(target)
                //如果代理目标是数组，则检测被设置的索引值是否小于数组长度  如果是对象判断对象上是否有这个属性
                ? Number(key) < target.length ? "SET" : "ADD" : Object.prototype.hasOwnProperty.call(target, key) ? "SET" : "ADD";
            const res = Reflect.set(target, key, newValue, receiver)
            // 判断receiver是target的代理对象 就执行解决了 child[[set]]调用和parent[[set]]调用 两次响应式函数执行的问题
            if (target === receiver.raw) {
                //旧的值和新的值不同的时候 在触发响应 并且都不是NAN的时候 在触发响应
                if (oldValue !== newValue && (oldValue === oldValue || newValue === newValue)) {
                    trigger(target, key, type, newValue) //增加第四个参数 触发响应的新值
                }
            }
            return res
        },
        //副作用函数通过 in 操作符操作响应式数据时，能够建立依赖关系
        has(target, key) {
            track(target, key)
            return Reflect.has(target, key)
        },
        //拦截for in函数  因为track是symbol值 所以track也点改变
        ownKeys(target) {
            //判断是否是数组 数组也会forin循环 ? 数组length函数 : 将副作用函数和ITERATE_KEY相关联
            track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
            return Reflect.ownKeys(target)
        },
        deleteProperty(target, key) {
            if (isReadonly) {
                console.warn(`属性${key}是只读的`);
                return true //只读属性返回出去
            }
            //检查被操作的属性是否是对象自己的属性
            const hadKey = Object.prototype.hasOwnProperty.call(target, key)
            const res = Reflect.deleteProperty(target, key) //使用Reflect删除属性
            if (res && hadKey) {
                //属性删除成功 触发响应
                trigger(target, key, 'DELETE')
            }
            return res
        }
    })
}


//定义一个map实例，存储原始对象到代理对象的映射 优先检查是否已经存在的代理对象 避免为一个原始对象多次创建代理对象的问题
const reactiveMap = new Map();
function reactive(obj) {
    //优先通过原始对象obj寻找之前创建的代理对象，如果找到了，直接返回已有的代理对象
    const existionProxy = reactiveMap.get(obj)
    if (existionProxy) {
        return existionProxy
    }
    //创建新的代理对象 
    const proxy = createReactive(obj)
    //存储到Map中 从而避免重复创建
    reactiveMap.set(obj, proxy)
    return proxy
}