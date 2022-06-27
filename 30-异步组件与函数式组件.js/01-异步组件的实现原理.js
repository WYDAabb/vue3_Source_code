//用户接口设计
const AsyncComp = defineAsyncComponent({
    loader: () => import("./APP.vue"),
    timeout: 2000,// 超时时长，其单位为ms
    errorComponent: MyErrorComponent // 指定出错的时候要渲染的组件
})




//defineAsyncComponent大多数用于定义一个异步组件，接收一个异步组件加载器作为参数
function defineAsyncComponent(loader) {
    //一个变量 ，用来存储异步加载的组件
    let InnerComp = null;
    //返回一个包装组件
    return {
        name: 'AsyncComponentWrapper',
        setup() {
            //异步组件是否加载成功
            const loaded = ref(false)
            //执行挂载器函数，返回一个promise实例
            //加载成功后，将加载成功的组件赋值给InnerComp，并将loaded标志标记为true，代表加载成功
            loader().then(c => {
                InnerComp = c;
                loaded.value = true
            });
            return () => {
                //如果异步组件加载 成功，则渲染该组件，否则渲染一个展位内容
                return loaded.value ? { type: InnerComp } : { type: Text, Children: "我是一个占位符" }
            }
        }
    }

}