
//用户接口设计
const AsyncComp = defineAsyncComponent({
    loader: () => import("./APP.vue"),
    delay: 200, //延迟200ms展示Loading组件
    //loading组件
    loadingComponent: {
        setup() {
            return () => {
                return { type: 'div', children: 'Loading...' }
            }
        }
    },
    timeout: 2000,// 超时时长，其单位为ms
    errorComponent: MyErrorComponent // 指定出错的时候要渲染的组件
})


//unmount卸载函数
function unmount(vnode) {
    //Fragment处理所有子节点
    if (vnode.type === Fragment) {
        vnode.children.forEach(c => unmount(c))
        return
    } else if (vnode.type === 'object') {
        //对于组件的卸载,本质上是要卸载组件所渲染的内容 即subTree
        unmount(vnode.component.subTree);
        return
    }
    const parent = vnode.el.parentNode
    if (parent) {
        parent.removeChild(vnode.el)
    }
}


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
            //一个标志，代表是否正在加载，默认false
            const loading = ref(false)

            let loadingTimer = null;
            //如果配置项中存在delay 那么开启一个定时器，当延迟到时后，将loading.value的值设置为true
            //在delay时间之中不加载
            if (options.delay) {
                loadingTimer = setTimeout(() => {
                    loading.value = true
                }, options.delay);
            } else {
                //如果配置项中没有delay，则直接标记中加载中
                loading.value = true
            }

            //执行挂载器函数，返回一个promise实例
            //加载成功后，将加载成功的组件赋值给InnerComp，并将loaded标志标记为true，代表加载成功
            loader().then(c => {
                InnerComp = c;
                loaded.value = true
                //添加catch语句来捕获来加载过程中的错误
            }).catch(err => {
                error.value = err
            }).finally(() => {
                loading.value = false
                //加载完毕后 无论成功与否都要清除延迟定时器
                clearTimeout(loadingTimer)

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
                } else if (loading.value && options.loadingComponent) {
                    //如果异步组件正在加载，并且用户指定了loading组件，则渲染loading组件
                    return { type: options.loadingComponent }
                } else {
                    return placeholder
                }

            }
        }

    }
}