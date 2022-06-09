//产生响应式丢失的问题

/*
setup(props) {
    const obj = reactive({ foo: 1, bar: 2 })  //响应式对象、

    return {
        ...obj  //展开运算符 返回一个普通对象
    }
}
*/


// 解决方法

const obj = reactive({ foo: 1, bar: 2 })  //响应式对象

const newObj = {
    foo: {
        get value() {
            return obj.foo  //实际返回的是响应式对象
        }
    },
    bar: {
        get value() {
            return obj.bar
        }
    }
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