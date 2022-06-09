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
        let res = fn()
        //在当前副作用函数执行完毕之和 ,将当前副作用函数弹出栈 并将acttiveEffect还原之前的值
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1]

        //将 fn的执行函数返回值返回出去
        return res
    }
    //activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.options = options //设置一个调度对象 里面内容是调度函数 scheduler 函数
    effectFn.deps = []
    if (!options.lazy) { //非lazy:true的时候才执行
        effectFn()
    }

    return effectFn //副作用函数返回 自己去执行
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
    //根据key 拿到对应的effect函数 进行副作用函数的重新执行
    const effects = depsMap.get(key)
    const effectsToRun = new Set(effects)
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
            effectsToRun.add(effectFn)
        }
    })
    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler) { //如果这个调度执行函数存在那么就延缓执行
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
        Reflect.set(target, key, newValue);
        trigger(target, key)
        return true
    }
})

function computed(getter) {
    /* 实现缓存 */
    let value  //缓存值 
    //标识缓存是否需要重新计算  dirty = true 需要计算
    let dirty = true
    const effectFn = effect(getter, {
        lazy: true,
        scheduler() { //调度器执行后 就证明数据变化了
            if (!dirty) {
                dirty = true
                //解决effect使用computed的问题 手动调用trigger函数触发
                trigger(obj, "value")
            }
        }
    })

    const obj = {
        get value() {
            if (dirty) { //dirty为true 需要重新执行
                value = effectFn();
                dirty = false //dirty 设置为false 下一次直接访问value的值
            }
            //当读取value的时候 重新收集依赖 
            track(obj, "value")
            return value
        }
    }
    return obj
}

// obj.foo++
//实现了 懒计算 调用的时候 才计算
const sumRefs = computed(() => obj.foo + obj.bar)

effect(() => {
    console.log(sumRefs.value);
})

setTimeout(() => {
    obj.foo++
}, 1000);




