const vnode = {
    type: 'div',
    //使用props来描述一个元素的属性 key代表属性名称 value代表属性的值
    props: {
        id: 'foo'
    },
    children: [
        {
            type: 'p',
            children: 'hello'
        }
    ]
}


function createRenderer(options) {

    const { createElement, setElementText, insert } = options

    //mountElement 挂载函数
    function mountElement(vnode, container) {
        //使用vnode type名称创建标签名称
        const el = createElement(vnode.type);
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
                el.setAttribute(key, vnode.props[key])
                //也可以使用DOM对象直接设置
                // el[key] = vnode.props[key]
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
    }

}
const renderer = createRenderer(options1)

renderer.render(vnode, document.querySelector('#app'))