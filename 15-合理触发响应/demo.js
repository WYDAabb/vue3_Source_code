const obj = {
    name: 'wangyaoda',
    age: '20'
}

let p = new Proxy(obj, {
    get: function (target, key, receiver) {
        console.log('target', target);
        console.log('key', key);
        console.log('receiver', receiver);
        return Reflect.get(target, key, receiver);
    }
})


console.log(p.name);