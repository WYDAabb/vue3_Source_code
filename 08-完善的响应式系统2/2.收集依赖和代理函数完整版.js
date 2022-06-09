const data = { ok: true, text: 'hello world' };

//清除副作用
function cleanup(effectFn) {
    //遍历数组
    for (let i = 0; i < effectFn.deps.length; i++) {
        //deps是依赖集合
        const deps = effectFn.deps[i]
        //将effectFn 从依赖集合中移除  取出的是一个set 删除中的副作用函数
        deps.delete(effectFn)
    }
    //重置effectFn.deps数组
    effectFn.deps.length = 0
}


//副作用函数 当值改变的时候 重新执行这个函数
let activeEffect  //设置一个顶层变量 用来设置具体的副作用函数
function effect(fn) {
    //effectFn是一个函数 如果这个函数不执行 那么里面的fn也不会执行
    const effectFn = () => {
        //cleanup 清除工作
        cleanup(effectFn);
        activeEffect = effectFn
        fn()
    }
    //activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.deps = []
    //执行副作用函数
    effectFn()
}



const bucket = new WeakMap();
//追踪变化函数 也可以说是收集依赖函数
function track(target, key) {
    if (!activeEffect) return
    //根据target从桶中获取depsMap 他也是个map类型 key===>set
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
    //将其添加到 activeEffect.deps数组中
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
    effectsToRun.forEach(effectFn => {
        effectFn();
    });
}

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

//一个匿名的副作用函数
effect(() => {
    console.log('effect-run');
    document.body.innerHTML = obj.ok ? obj.text : 'not';
});


// obj.ok = false;
// obj.text = 'hello vue3'

setTimeout(() => {
    obj.ok = false;
    obj.text = 'hello vue3'
}, 1000);