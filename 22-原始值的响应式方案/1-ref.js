function ref(val) {
    //ref函数内部创建包裹对象
    const wrapper = {
        value: val
    }

    return reactive(wrapper)
}

const refVal = ref(1)

effect(() => {
    //副作用函数内通过value属性读取原始值
    console.log(refVal.value);
})