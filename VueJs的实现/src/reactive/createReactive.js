//isShallow 判断是否是浅响应 isReadonly 只读
//创建响应式函数
export function createReactive(data, isShallow = false, isReadonly = false) {
    return new Proxy(data, {
        get(target, key, receiver) {// receiver 代表代理对象
            //代理对象可以通过raw属性访问原始数据  receiver.raw = target 解决原型引起的 多次调用effect[[set]]方法的问题
            if (key === 'raw') {
                return target
            }

            // 非只读的时候 才建立收集依赖 要不只读的时候浪费性能 只读肯定不是响应式 因为不能修改
            if (!isReadonly) {
                track(target, key);
            }
            const res = Reflect.get(target, key, receiver);
            //浅响应 直接返回
            if (isShallow) {
                return res
            }
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
            const type = Object.prototype.hasOwnProperty.call(target, key) ? "SET" : "ADD";
            const res = Reflect.set(target, key, newValue, receiver)
            // 判断receiver是target的代理对象 就执行解决了 child[[set]]调用和parent[[set]]调用 两次响应式函数执行的问题
            if (target === receiver.raw) {
                //旧的值和新的值不同的时候 在触发响应 并且都不是NAN的时候 在触发响应
                if (oldValue !== newValue && (oldValue === oldValue || newValue === newValue)) {
                    trigger(target, key, type)
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
            //将副作用函数和ITERATE_KEY相关联
            track(target, ITERATE_KEY)
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