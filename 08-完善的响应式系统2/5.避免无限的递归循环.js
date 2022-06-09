const data = { foo: 1, bar: true };
//清除副作用

function cleanup(effectFn) {
    //遍历数组
    for (let i = 0; i < effectFn.deps.length; i++) {
        //deps是依赖集合
        const deps = effectFn.deps[i]  //deps是set集合 将set里面对应的响应式函数删除
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

function effect(fn) {
    //effectFn是一个函数 如果这个函数不执行 那么里面的fn也不会执行
    const effectFn = () => {
        //cleanup 清除工作
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
    effectFn.deps = []
    //执行副作用函数
    effectFn()
}


//追踪变化函数 也可以说是收集依赖函数
function track(target, key) {
    //如果没有activeEffect 就直接return
    if (!activeEffect) return
    //根据target从桶中获取depsMap 他也是个map类型 key===>effect
    let depsMap = bucket.get(target)
    //如果不存在depsMap 新建一个map与target关联
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    //再根据key从depsMap中获得deps 他是一个Set类型，里面存储着所有与当前key相关里的副作用函数 effeccts
    let deps = depsMap.get(key);
    //如果deps不存在 同样建一个Set并且与Key相关联
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    //最后将当前激活的副作用函数添加到集合之中
    deps.add(activeEffect);
    //deps就是一个与当前副作用函数存在联系的依赖集合
    //将其添加到 activeEffect.deps数组中 这个数组里面是每一个的响应式函数的集合Set
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
    const effectsToRun = new Set()
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 防止无限的递归循环
            effectsToRun.add(effectFn)
        }
    })
    effectsToRun.forEach(effectFn => effectFn())
}

/* 
weakmap是弱引用的 使用WeakMap的原因就是当key所引用的对象存在时（没有被回收）才有价值的信息
如果target没有任何的引用 说明用户 不在需要它了 垃圾回收机制会完成回收任务;
*/
const bucket = new WeakMap();
const obj = new Proxy(data, {
    //拦截读取操作
    get(target, key) {
        //将副作用函数activeEffect添加到存储副作用函数的桶中
        track(target, key)
        //返回属性值
        return target[key]
    },
    //拦截设置操作
    set(target, key, newValue) {
        //设置属性值
        target[key] = newValue
        //副作用函数取出在执行
        trigger(target, key)
    }
})


effect(() => {
    obj.foo++
});

