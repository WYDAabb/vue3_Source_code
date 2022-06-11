
const vnode1 = {
    type: 'button',
    props: {
        disabled: ''
    },
    children: 'Button'
}

//用in操作符判断key是否存在对应的DomProperties 以及特殊只读属性的处理
function shouldSetAsProps(el, key, value) {
    //特殊处理
    if (key === ' from' && el.taName === 'INPUT') return false
    //兜底
    return key in el
}


function createRenderer(options) {

    const { createElement, setElementText, insert, patchProps } = options

    //mountElement 挂载函数
    function mountElement(vnode, container) {
        //让vnode.el引用真实dom元素 为了后续卸载dom节点使用 因为dom卸载节点需要使用父元素
        const el = vnode.el = createElement(vnode.type)
        //children处理
        if (typeof vnode.children === 'string') {
            //因此只需要设置元素的文本节点
            setElementText(el, vnode.children)
        } else if (Array.isArray(vnode.children)) {   //如果children是数组 那么遍历每一个子节点 并调用patch函数挂载
            vnode.children.forEach(child => {
                patch(null, child, el)
            });
        }
        // props属性处理
        if (vnode.props) {
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key])
            }
        }

        //将元素添加到容器之中
        insert(el, container);
    }

    //patch函数传入三个参数 第一个旧的vnode 第二个新的vnode 第三个同期
    function patch(n1, n2, container) {
        //如果n1不存在，意味着挂载 则调用mountElement函数完成挂载
        if (!n1) {
            mountElement(n2, container);
        } else {
            //n1存在 意味着打补丁 暂时省略
        }
    }

    function render(vnode, container) {
        if (vnode) {
            //如果新的vnode存在 将其与旧的vnode一起传递给patch函数 进行打补丁 我叫做patch比较函数
            patch(container._vnode, vnode, container)
        } else {
            if (container._vnode) {
                //如果旧的vnode存在 并且新的vnode不存在 说明是卸载操作
                //需要将container内的dom清空即可
                container.innerHTML = ''
            }
        }
        //将vnode存储到container._vnode下面 既后续渲染中旧的vnode
        container._vnode = vnode
    }

    return {
        render
    }
}

const options1 = {  //浏览器使用
    //用于创建元素
    createElement(tag) {
        return document.createElement(tag);
    },
    //用于设置元素的文本节点
    setElementText(el, text) {
        el.textContent = text;
    },
    //用于给定的parent下添加指定元素
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor)
    },
    //用来处理props中的属性
    /* 
    * params
    * 挂载节点el  
    * 当前元素属性的key
    * 修改前的属性值
    * 当前元素属性的props值
    */
    patchProps(el, key, preValue, nextValue) {
        //对class的特殊处理
        if (key === 'class') {
            el.className = nextValue || ''
        }
        //使用shouldSetAsProps函数来判断是否作为Dom Properties设置
        else if (shouldSetAsProps(el, key, nextValue)) {
            //获取DOM properties的类型
            const type = typeof el[key];
            //如果是布尔类型，并且value是空字符串，则矫正为true 优先设置Dom Properties
            if (type === 'boolean' && nextValue === '') {
                el[key] = true;
            } else {
                el[key] = value;
            }
        } else {
            el.setAttribute(key, nextValue)
        }
    }

}
const renderer = createRenderer(options1)

renderer.render(vnode1, document.querySelector('#app'))

setTimeout(() => {
    renderer.render(null, document.querySelector('#app'))
}, 1000)