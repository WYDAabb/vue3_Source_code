function foo() {
    return 123
}

foo.deps = ['1', '3', '4']

foo.obj = {
    name: 'wyd',
    name: 20
}

console.log(foo.deps);

let set1 = new Set([1, 2, 3, 4, 5])

let set2 = new Set([5, 4, 3, 2, 1])

let set3 = new Set(['a', 'b', 'c', 'd'])

let arr = [set1, set2, set3]


for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    element.delete(2)
}

console.log(arr);

/*
[
  Set(4) { 1, 3, 4, 5 },
  Set(4) { 5, 4, 3, 1 },
  Set(4) { 'a', 'b', 'c', 'd' }
]
*/