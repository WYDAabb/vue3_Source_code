
const bar = {
    name: 'w1',
    age: 20,
    props: {
        title: String
    },
}

const foo = {
    name: 'wangyaoda',
    type: bar
}


const ere = foo.type
console.log(ere);
//起了一个别名 解构赋值
const { name, age, props: propsOptions } = ere
console.log(name, age, propsOptions);