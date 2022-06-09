function proxyRefs(target) {
    return new Proxy(target, {
        //读取ref对象的时候 脱ref能力
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            return value.__v_isRef ? value.value : value; //判断是否是ref 如果是就返回出value否则就是reactive对象
        },
        set(target, key, newValue, receiver) {
            //通过target读取真实值
            const value = target[key]
            //如果值是ref，则设置对应的value属性值
            if (value.__v_isRef) {
                value.value = newValue
                return true
            }
            return Reflect.set(target, key, newValue, receiver)
        }
    })
}

//因为newObj中的 bar和foo函数非常像 所以我们进行抽离封装 
//vue3里面 可以用 toRef 去从reactive结构出一个响应式原始值
function toRef(obj, key) {
    const wrapper = {
        //现在只是读取ref对象
        get value() {
            return obj[key]
        },
        set value(newValue) {
            obj[key] = newValue;
        }
    }
    //给 wrapper对象添加一个不可以枚举的属性__v_isRef，并且值为true 判断是否是ref
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })
    return wrapper.value
}



const newObj = {
    foo: toRef(obj, 'foo'),
    bar: toRef(obj, 'bar')
}


//如果key特别多的话 使用toRefs结构 
//vue3中使用toRefs 从reactive解构出多个响应式原始值
function toRefs(obj) {
    const ret = {}
    for (const key in obj) {
        //逐个调用toRef来解决问题
        ret[key] = toRef(obj, key)
    }
    return ret
}

const newObj = proxyRefs({ ...toRefs(obj) })