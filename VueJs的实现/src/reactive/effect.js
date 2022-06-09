

const data = { foo: 1, bar: 2 };

//清除副作用
function cleanup(effectFn) {
    //遍历数组
    for (let i = 0; i < effectFn.deps.length; i++) {
        //deps是依赖集合
        const deps = effectFn.deps[i]
        //将effectFn 从依赖集合中移除
        deps.delete(effectFn)
    }
    //重置effectFn.deps数组
    effectFn.deps.length = 0
}



//设置一个顶层变量 用来设置具体的副作用函数
let activeEffect
//写一个函数执行栈 类似ECStack一样 让activeEffect始终指向栈顶
const effectStack = [];
//副作用函数 当值改变的时候 重新执行这个函数
function effect(fn, options = {}) {
    //effectFn是一个函数 如果这个函数不执行 那么里面的fn也不会执行
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn
        //在调用副作用函数之前将当前的副作用函数压入栈中
        effectStack.push(effectFn)
        fn()
        //在当前副作用函数执行完毕之和 ,将当前副作用函数弹出栈 并将acttiveEffect还原之前的值
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1]
    }
    //activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.options = options //设置一个调度对象 里面内容是调度函数 scheduler 函数
    effectFn.deps = []
    if (!options.lazy) { //非lazy:true的时候才执行
        effectFn()
    }
    return effectFn //副作用函数返回 自己去执行
}

/* 
数据结构
weakMap:{
    对象:{
        key:Set({所有响应式函数})
    }
}
*/

//追踪变化函数 也可以说是收集依赖函数
function track(target, key) {
    if (!activeEffect) return
    let depsMap = bucket.get(target)
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps)
}

//触发变化函数
function trigger(target, key, type) {
    //根据target从桶中取得 depsMap 是key ==> effect
    const depsMap = bucket.get(target);
    //如果没有就返回出去
    if (!depsMap) return
    //根据key 拿到对应的effect函数 进行副作用函数的重新执行
    const effects = depsMap.get(key)
    const effectsToRun = new Set(effects)

    //与key相关联的副作用函数放入 effectsToRun
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
            effectsToRun.add(effectFn)
        }
    })
    // console.log(type, key);
    //当操作为ADD 和 DELETE时候 重新执行
    if (type === "ADD" || type === "DELETE") {
        //取得与ITERATE_KEY相关的副作用函数变量
        const iterateEffects = depsMap.get(ITERATE_KEY)
        //与ITERATE_KEY相关联的副作用函数放入 effectsToRun
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn)
            }
        })

    }
    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler) { //如果这个调度执行函数存在那么就延缓执行
            effectFn.options.scheduler(effectFn)
        } else {
            effectFn();
        }
    })

}

const bucket = new WeakMap();
const ITERATE_KEY = Symbol();//因为ownKeys不具备属于自己的键值 所以自定义键值 for-in 使用

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

//响应式函数
function reactive(obj) {
    return createReactive(obj)
}
//只读函数
function shallowReadonly(obj) {
    return createReactive(obj, true, true /* 只读 */)
}

function readonly(obj) {
    return createReactive(obj, false, true /* 只读 */)
}

const arr = reactive(["foo"])

effect(() => {
    console.log(arr[0]);
})

arr[0] = 6
