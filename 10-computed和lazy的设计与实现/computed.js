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
    }
})

effect(() => {
    console.log(obj.foo);
}, {
    lazy: true
});


//因为返回额是一个不可变的响应式ref对象 ref.value么 计算属性=懒计算+缓存 
// 计算属性 就是调用这个effect函数的同时传入调度器 并且在调度器内实现缓存 和上一次值的保存
function computed(getter) {
    let value = null; //缓存上一次的值
    let dirty = true //标识 判断是否需要计算 如果为true就表示需要计算  上来就为true就是上来就进行一次计算 后续改成false
    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {  //添加调度器 将dirty改成true
            if (!dirty) {
                dirty = true;
                trigger(obj, 'value') //当计算属性依赖响应式数据发生变化的时候手动调用trigger函数触发相应
            }
        }
    });
    const obj = {
        //读取value才会执行 effectFn函数
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            //当读取value时，手动调用track函数进行追踪
            track(obj, 'value')
            return value
        }
    }
    return obj;
}