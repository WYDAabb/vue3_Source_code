//重写数组中的部分方法
//将所有的数组相关函数写在原型上面 抽离
const originMethod = Array.prototype.includes
const arrayInstrumentations = {
    includes: function (...args) {
        //this是代理对象，先在代理对象中查找，将结果存储到res中
        let res = originMethod.apply(this, args)
        if (res === false) {
            //res如果是false 说明没找到 通过this.raw拿到原始数组，再去查找并更新res
            res = originMethod.apply(this.raw, args)
        }
        return res
    }
}








//重写数组中所有的查找方法
const ArrayMethods = ['includes', 'indexOf', 'lastIndexOf']
const arrayInstrumentations = {}
ArrayMethods.forEach(method => {
    const originMethod = Array.prototype[method]
    arrayInstrumentations[method] = function (...args) {
        //this是代理对象，先在代理对象中查找，将结果存储到res中
        let res = originMethod.apply(this, args)
        if (res === false) {
            //res如果是false 说明没找到 通过this.raw拿到原始数组，再去查找并更新res
            res = originMethod.apply(this.raw, args)
        }
        return res
    }
});
