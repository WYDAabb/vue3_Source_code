//wattch的实现也是调度器和effect函数的实现




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
    if (!options.lazy) {
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
            effectFn.options.scheduler(effectFn.options)
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
    }
})

//递归函数 可以读取对象中的任意属性，从而当任意属性发生变化都能触发回调函数
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

//watch函数接收两个参数，source是响应式的数据或者函数,callback是回调函数

//观测响应式数据 和一个getter函数 watch的新值和旧值 的取舍需要用到调度器里面的lazydao1
function watch(source, callback, options = {}) {
    //定义getter
    let getter
    //如果source是函数 说明用户传递的是getter 赋值source
    if (typeof source === 'function') {
        getter = source
    } else {
        //否则getter就是原来的递归处理响应式数据
        getter = () => traverse(source)
    }

    //定义旧的值和新的值
    let oldValue, newValue
    //调度函数抽出来
    const job = () => {
        //在scheduler中重新执行副作用函数,得到的是新的值 因为数据改变后 trigger里面判断是否有调度执行函数 如果有就在scheduler重新执行一次
        newValue = effectFn();
        //将旧的值和新的值作为回调函数的参数
        callback(newValue, oldValue);
        //更改旧值，不然下一次会得到错误的旧值
        oldValue = newValue;
    }
    //开启lazy选项 并把返回值存储到effectFn中以便后续手动调用
    const effectFn = effect(
        () => getter(), {
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
        //当immediate为true的时候 立即执行job 从而触发回调执行
        //第一次执行没有旧的值
        job();
    } else {
        //手动调用副作用函数得到的旧的值
        oldValue = effectFn();
    }
}



effect(
    //递归 traverse 调用读取
    () => traverse(source),
    {
        scheduler() {
            //当数据变化的时，调用回调函数
            callback()
        }
    }
)

// 现在的使用 
watch(obj, () => {
    console.log('数据变化了');
})
obj.foo++;