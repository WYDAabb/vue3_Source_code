//响应系统拦截一切读取操作，以便当数据变化能正确触发相应
/*
1.访问属性 obj.foo
2.判断对象或原型上是否存在给定的key key in obj
3.使用for in 遍历对象
*/

//1.访问属性
const obj1 = { foo: '1' }
const p = new Proxy(obj, {
    get(target, key, receiver) {
        track(target, key)
        return Reflect.get(target, key, receiver)
    }
})

//2.对于in的拦截 用对象内部的方法HasProperty 可以用Proxy的has
const obj2 = { foo: '2' }
const p = new Proxy(obj, {
    has(target, key) {
        track(target, key)
        return Reflect.has(target, key)
    }
})


//3.拦截for in的方法 通过proxy的ownKeys查看对象自己所有的key     可以看2-trigger函数的重构  3-trigger函数的重构
const obj3 = { foo: '3' }
const ITERATE_KEY = Symbol();//因为ownKeys不具备属于自己的键值 所以自定义键值
const p = new Proxy(obj, {
    ownKeys(target) {
        //将副作用函数和ITERATE_KEY相关联
        track(target, ITERATE_KEY)
        return Reflect.ownKeys(target)
    }
})

//4.删除对象中的属性 delete操作符   
const p = new Proxy(obj, {
    deleteProperty(target, key) {
        //检查被操作的属性是否是对象自己的属性
        const hadKey = Object.prototype.hasOwnProperty.call(target, key)
        //使用Reflect.deleteProperty完成属性的删除
        const res = Reflect.deleteProperty(target, key)

        //只有当被删除的属性是对象自己的属性并且成功删除时，才会触发更新
        if (res && hadKey) {
            trigger(target, key, 'DELETE')
        }

        return res
    }
})

//5.关于delete函数重构 trigger函数

//触发变化函数
function trigger(target, key, key) {
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

    console.log(type, key);
    //判断类型为ADD和DELETE的时候 才出发与ITERATE_KEY相关函数的重新执行  DELETE会影响forin的次数所以也要重新收集forin函数变量
    if (type === 'ADD' || type === 'DELETE') {
        const iterateEffects = depsMap.get(ITERATE_KEY) //取得与forin相关的副作用函数变量
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {  //判断是否是同一个副作用函数 如果是就不执行函数 解决递归调用的问题
                effectsToRun.add(effectFn)
            }
        })
    }

    effectsToRun.forEach(effectFn => {
        if (effectFn.options.scheduler) { //如果这个调度执行函数存在那么就延缓执行
            effectFn.options.scheduler(effectFn.options)
        } else {
            effectFn();
        }
    })
}
