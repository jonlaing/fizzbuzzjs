// Hey! Check out my super indepth blog post about what possessed me to make
// FizzBuzz this complicated! https://jonlaing.github.io/2017/11/07/over-engineered-fizz-buzz.html 
'use strict';

// some convenience functions for readability
const when = (pred, f) => (n, text) => pred(n) ? f(text) : text;

const isMultiple = x => y => y % x === 0;

const concatString = s1 => s0 => s0 + s1;

const range = (min, max) =>
  Array.from(Array(max - min + 1).keys(), x => x + min);

// implementing the Functor
const Fizzer = (n, text) => ({
  map: f => Fizzer(n, f(n, text || '')),
  done: () => text && text.length > 0 ? text : n // get out of the functor
});

const fizzIt = n =>
  Fizzer(n)
    .map(when(isMultiple(3), concatString("Fizz")))
    .map(when(isMultiple(5), concatString("Buzz")))
    .done();

const fizzBuzz = (min, max) =>
  range(min, max)
    .map(fizzIt)
    .map(x => console.log(x));

fizzBuzz(1, 100);

module.exports = {
    when,
    isMultiple,
    concatString,
    range,
    Fizzer,
    fizzIt,
    fizzBuzz
};
