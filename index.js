"use strict";

// A fizzer/num monad is essentially an Either monad, with `fizzer` being the
// `left` and `num` being the right.

const fizzer = test => s => v => ({
    fizzer: f => fizzer(test)(f(s, v))(v),
    num: () => fizzer(test)(s)(v),
    lift: () => s,
    concat: m => m
        .fizzer((s2, v2) =>
            v2 % test === 0 ?
                s2 + s :
                s2)
        .num(n =>
            n % test === 0 ?
                fizzer(test)(s)(n) :
                num(n))
});

const num = v => ({
    fizzer: () => num(v),
    num: f => f(v), // flatten for these purposes
    lift: () => v,
    concat: () => num(v)
});


const fizz = fizzer(3)("Fizz");
const buzz = fizzer(5)("Buzz");
const baz = fizzer(7)("Baz");

const fizzbuzz = max =>
    Array.from(Array(max).keys(), x => x + 1)
        .map(num)
        .map(e => fizz(0).concat(e))
        .map(e => buzz(0).concat(e))
        .map(e => baz(0).concat(e))
        .map(e => e.lift());

const max = parseInt(process.argv[2])

console.log(fizzbuzz(max));
