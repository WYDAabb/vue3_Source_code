//存储副作用函数的bucket
const bucket = new Set();

//原始数据
const data = { text: 'hello,world' }

//对原始数据的代理

const obj = new Proxy(data, {
    get(target, key) {
        //将副作用函数 effect添加到存储副作用函数的桶中
        if (activeEffect) {
            bucket.add(activeEffect)
        }
        //返回属性值
        return target[key]
    },
    //设置拦截操作
    set(target, key, newValue) {
        target[key] = newValue;
        //把副作用函数从桶里取出并执行
        bucket.forEach((fn) => {
            fn && fn();
        })
        return true
    }
});

//副作用函数 当值改变的时候 重新执行这个函数
let activeEffect  //设置一个顶层变量 用来设置具体的函数
function effect(fn) {
    //当调用effect注册副作用函数时，将副作用函数 fn赋值给activeEffect
    activeEffect = fn;
    //执行副作用函数
    fn();
}
//一个匿名的副作用函数
effect(() => {
    console.log('effect-run');
    document.body.innerHTML = obj.text;
});

//一秒后触发函数
setTimeout(() => {
    // obj.text = 'hello vue3'
    obj.notExist = 'hello vue3'
}, 1000);