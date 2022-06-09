const data = { foo: 1 };
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

//副作用函数 当值改变的时候 重新执行这个函数
let activeEffect  //设置一个顶层变量 用来设置具体的副作用函数
//写一个函数执行栈 类似ECStack一样 让activeEffect始终指向栈顶
const effectStack = [];
function effect(fn, options = {}) {
    //effectFn是一个函数 如果这个函数不执行 那么里面的fn也不会执行
    const effectFn = () => {
        cleanup(effectFn);
        activeEffect = effectFn
        //在调用副作用函数之前将当前的副作用函数压入栈中
        effectStack.push(effectFn)
        const res = fn()
        //在当前副作用函数执行完毕之和 ,将当前副作用函数弹出栈 并将acttiveEffect还原之前的值
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1]
        return res;//返回真正的副作用函数
    }
    //activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.deps = []
    effectFn.options = options //设置一个调度对象 里面内容是调度函数 scheduler 函数
    if (!options.lazy) { //options如果是一个lazy:true的话 那么就不执行  将内容 effectFn 返回出去 我们自己执行
        effectFn()
    }
    return effectFn //将副作用函数作为返回值返回 
}

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
function trigger(target, key) {
    //根据target从桶中取得 depsMap 是key ==> effect
    const depsMap = bucket.get(target);
    //如果没有就返回出去
    if (!depsMap) return
    //根据key 拿到对应的effect函数 进行副作用函数的重新执 行
    const effects = depsMap.get(key)
    const effectsToRun = new Set(effects)
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数
            effectsToRun.add(effectFn)
        }
    })
    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler) { //如果这个调度执行函数存在那么就按照调度执行
            effectFn.options.scheduler(effectFn)
        } else {
            effectFn();
        }
    })
}

const bucket = new WeakMap();
const obj = new Proxy(data, {
    get(target, key) {
        track(target, key)
        return target[key]
    },
    //拦截设置操作
    set(target, key, newValue) {
        target[key] = newValue
        trigger(target, key)
        return true
    }
})


//解决硬编码问题 使用递归函数
function traverse(value, seen = new Set()) {
    //1.如果要读取的数据是原始值 或者已经被读取到了 那么什么都不做
    if (typeof value !== 'object' || value === null || seen.has(value)) {
        return
    }
    //2.将数据添加到seen之中，代表遍历地读取过了，避免循环引用引起的死循环
    seen.add(value)
    //暂时不考虑数组等其他结构
    //假设value就是一个对象 使用for in遍历读取对象中的每一个值，并递归的调用traverse函数进行处理
    for (const key in value) {
        traverse(value[key], seen)
    }

    return value
}

/* 
* params
* 监听的函数
* 回调函数
* 执行时机
*/

function watch(source, cb, options = {}) {
    let getter

    //判断是否是函数 如果是函数说明传递的getter 所以直接把source赋值给getter
    if (typeof source === 'function') {
        getter = source;
    } else {
        getter = () => traverse(source)
    }

    let oldValue, newValue

    //用来存储用户注册的过期回调
    let cleanup
    //定义onInvalidate函数

    function onInvalidate(fn) {
        //将回调函数 存储到cleanup中
        cleanup = fn
    }



    //调度器单独抽成一个函数
    const job = () => {
        //因为trigger 触发后 肯定是重新执行副作用函数 所以是新的值
        newValue = effectFn();
        //在调用回调函数cb之前，先调用过期回调
        if (cleanup) {
            cleanup();
        }
        //将旧的值和新的值 作为回调函数的参数
        cb(newValue, oldValue, onInvalidate);
        oldValue = newValue; //更新旧的值
    }

    const effectFn = effect(
        () => getter(),
        {
            lazy: true,
            scheduler: () => {
                //在调度函数中判断flush是否为'post'，如果是，将其放到微任务队列中进行  flush判断执行时机
                if (options.flush === 'post') {
                    const p = Promise.resolve();
                    p.then(job)
                } else {
                    job();
                }
            }
        })


    if (options.immediate) {
        //当immediate为true 立即执行一次job 新旧值 oldValue= undefined
        job();
    } else {
        oldValue = effectFn();
    }

}

watch(() => obj.foo, (newValue, oldValue, onInvalidate) => {
    console.log('数据变化了', "oldValue", oldValue, "newValue", newValue);
}, {
    immediate: true,
    flush: 'post'    // flush: "post", //flush?: 'pre' | 'post' | 'sync' // 默认：'pre'   pre 提前执行  post：dom挂载完执行   sync 强制同步 【不建议使用】
})

obj.foo++

