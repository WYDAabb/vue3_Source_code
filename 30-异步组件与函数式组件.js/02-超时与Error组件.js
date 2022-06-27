//用户接口设计
const AsyncComp = defineAsyncComponent({
    loader: () => import("./APP.vue"),
    timeout: 2000,// 超时时长，其单位为ms
    errorComponent: MyErrorComponent // 指定出错的时候要渲染的组件
})




//defineAsyncComponent大多数用于定义一个异步组件，接收一个异步组件加载器作为参数
function defineAsyncComponent(options) {
    //options是配置项，也可以是加载器
    if (typeof options === 'function') {
        //如果是加载器那么将其格式化配置项的格式
        options = {
            loader: options
        }
    }
    const { loader } = options

    //一个变量 ，用来存储异步加载的组件
    let InnerComp = null;
    //返回一个包装组件
    return {
        name: 'AsyncComponentWrapper',
        setup() {
            //异步组件是否加载成功
            const loaded = ref(false)
            //定义error，当错误发生时候，用来存储错误对象
            const error = shallowRef(null)

            //执行挂载器函数，返回一个promise实例
            //加载成功后，将加载成功的组件赋值给InnerComp，并将loaded标志标记为true，代表加载成功
            loader().then(c => {
                InnerComp = c;
                loaded.value = true
                //添加catch语句来捕获来加载过程中的错误
            }).catch(err => {
                error.value = err
            })

            let timer = null;

            if (options.timeout) {
                //如果设置了超时时长，则开启一个定时器计算时间
                timer = setTimeout(() => {
                    //超时后创建一个错误对象，并赋值给error.value
                    const err = new Error(`Async component timed out after ${options.timeout}ms.`)
                    //超时后将错误赋值给外部变量
                    error.value = err;

                }, options.timeout)
            }
            //包装组件被卸载时清除定时器
            onUnmounted(() => { clearTimeout(timer); })
            //写一个占位内容 
            const placeholder = { type: Text, Children: "我是一个占位符" }
            return () => {
                if (loaded.value) {
                    //如果异步组件加载 成功，则渲染该组件，否则渲染一个展位内容
                    return { type: InnerComp }
                } else if (error.value && options.errorComponent) {
                    //如果加载超时了 并且用户指定了Error组件，则渲染该组件 同时将error作为props传递
                    return { type: options.errorComponent, props: { error: error.value } }
                } else {
                    return placeholder
                }

            }
        }

    }
}