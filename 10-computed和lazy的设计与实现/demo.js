function foo() {
    console.log('111');
    let a = '1'
    const bar = () => {
        console.log('222');
    }
    if (a == 1) {
        bar();
    }

}
foo();



const obj = {
    a: '11',
    get foo() {
        return a = 2
    },

    set foo(value) {
        a = value
    }
}

console.log(obj.foo = 9);