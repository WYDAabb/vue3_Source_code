//存储副作用函数的bucket
const bucket = new Set();

//原始数据
const data = { text: 'hello,world' }

//对原始数据的代理

const obj = new Proxy(data, {
    get(target, key) {
        //将副作用函数 effect添加到存储副作用函数的桶中
        bucket.add(effect)
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

//副作用函数 值改变的时候 这个函数重新执行 
function effect() {
    document.body.innerHTML = obj.text
}
//执行副作用函数 触发读取
effect();

//一秒后触发函数
setTimeout(() => {
    obj.text = 'hello vue3'
}, 1000);