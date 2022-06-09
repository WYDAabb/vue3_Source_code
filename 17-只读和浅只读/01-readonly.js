
// isReadOnly 判断是否是只读的
function createReactive(obj, isShallow = false, isReadOnly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            //代理对象可以通过raw属性访问原始数据
            if (key === 'raw') {
                return target
            }

            //非只读的时候 建立响应式收集依赖
            if (!isReadOnly) {
                track(target, key)
            }
            //得到原始执行结果
            const res = Reflect.get(target, key, receiver);
            //如果是浅相应就返回结果
            if (isShallow) {
                return res
            }

            if (typeof res === 'object' && res !== null) {
                //  调用reactive将结果包装成响应式数据并返回
                return reactive(res)
            }
            return res
        },

        set(target, key, newValue, receiver) {
            //如果只是只读的 打印警告信息
            if (isReadOnly) {
                console.warn(`属性${key}是只读的`);
                return true;
            }
            const oldValue = target[key];
            //判断变量type 如果属性不存在，说明是在添加属性，否则是设置已有属性
            const type = Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'
            const res = Reflect.set(target, key, newValue, receiver);
            //target === receiver.raw 说明receiver就是target的代理对象
            if (target === receiver.raw) {
                //比较新值和旧值，只有当他们不全等，并且都不是NAN的时候才触发相应    NAN === NAN(false)   NAN!==NAN(true) 
                if (oldValue !== newValue && (oldValue === oldValue || newValue || newValue)) {
                    trigger(target, key, type) //将类型传给trigger函数
                }
            }
            return res;
        },

        deleteProperty(target, key) {
            //如果只是只读的 打印警告信息
            if (isReadOnly) {
                console.warn(`属性${key}是只读的`);
                return true;
            }
            //检查被操作的属性是否是对象自己的属性
            const hadKey = Object.prototype.hasOwnProperty.call(target, key)
            //使用Reflect.deleteProperty完成属性的删除
            const res = Reflect.deleteProperty(target, key)

            //只有当被删除的属性是对象自己的属性并且成功删除时，才会触发更新
            if (res && hadKey) {
                trigger(target, key, 'DELETE')
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


function readonly(obj) {
    return createReactive(obj, false, true/* 只读 */)
}

