
//原始数据
const data = { text: 'hello,world' }

//副作用函数 当值改变的时候 重新执行这个函数
let activeEffect  //设置一个顶层变量 用来设置具体的函数
function effect(fn) {
    //当调用effect注册副作用函数时，将副作用函数 fn赋值给activeEffect
    activeEffect = fn;
    //执行副作用函数
    fn();
}


/* 
weakmap是弱引用的 使用WeakMap的原因就是当key所引用的对象存在时（没有被回收）才有价值的信息
如果target没有任何的引用 说明用户 不在需要它了 垃圾回收机制会完成回收任务;
*/
const bucket = new WeakMap();
const obj = new Proxy(data, {
    //拦截读取操作
    get(target, key) {
        //如果没有activeEffect 就直接return
        if (!activeEffect) return target[key];
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
        //最后将当前激活的副作用函数添加到桶李敏
        deps.add(activeEffect)
        //返回属性值
        return target[key]
    },

    //拦截设置操作
    set(target, key, newValue) {
        //设置属性值
        target[key] = newValue
        //根据target从桶中取得 depsMap 是key ==> effect
        const depsMap = bucket.get(target);
        //如果没有就返回出去
        if (!depsMap) return
        //根据key 拿到对应的effect函数 进行副作用函数的重新执 行
        const effect = depsMap.get(key)
        //map中的value是一个Set结构 所以我们要拿出来遍历一下 要不然
        effect && effect.forEach(fn => fn());
    }
})

//一个匿名的副作用函数
effect(() => {
    console.log('effect-run');
    document.body.innerHTML = obj.text;
});


//一秒后触发函数
setTimeout(() => {
    obj.text = 'hello vue3'
    // obj.notExist = 'hello vue3'
}, 1000);