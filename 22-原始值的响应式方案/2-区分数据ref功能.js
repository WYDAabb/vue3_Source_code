function ref(val) {
    //ref函数内部创建包裹对象
    const wrapper = {
        value: val
    }

    //给 wrapper对象添加一个不可以枚举的属性__v_isRef，并且值为true 判断是否是ref
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })

    return reactive(wrapper)
}

const refVal = ref(1)

effect(() => {
    //副作用函数内通过value属性读取原始值
    console.log(refVal.value);
})