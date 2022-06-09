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
        fn()
        //在当前副作用函数执行完毕之和 ,将当前副作用函数弹出栈 并将acttiveEffect还原之前的值
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1]
    }
    //activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.options = options //设置一个调度对象 里面内容是调度函数 scheduler 函数
    effectFn.deps = []
    effectFn()
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




//实现微任务队列 调度器控制执行次数
const jobQueue = new Set();
//使用promise.resolve创建一个promise实例，我们用它将一个任务添加到微任务队列
const p = Promise.resolve();
//一个标志看是否在刷新队列 
let isFlushing = false;
function flushJob() {
    //队列正在刷新 什么都不用做
    if (isFlushing) return
    //设置为true 表示正在刷新
    isFlushing = true
    //微任务队列中刷新jobQueue队列
    p.then(() => {
        jobQueue.forEach(job => job()) //执行体
    }).finally(() => {
        //结束后重置
        isFlushing = false
    })
}

effect(() => {
    console.log(obj.foo);
});


obj.foo++;
console.log('结束了');