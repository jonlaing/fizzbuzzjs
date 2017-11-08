An Over-Engineered Fizz Buzz
--------------------------------------------------------------------------------
Ever wanted to take a simple problem and completely over think it in a futile attempt to learn something about the world in your place in it? Well, anyway, this is about "Fizz Buzz" and how to completely over engineer it, and also some ramblings about abstraction.

Anyone who has spent any time around tech knows what Fizz Buzz is. It's basically a bare minimum indication that someone can at least use `if` statements.

In case your your memory has escaped you, this is a more-or-less common implementation (in Javascript):

```javascript
// fizzbuzz.js

const fizzbuzz = (n) => {
  let out = "";

  if(n % 3 === 0) out += "Fizz";
  if(n % 5 === 0) out += "Buzz";

  return out || n;
};

// make an array from 1 - 100
Array.from(Array(100).keys(), x => x + 1)
  .map(fizzbuzz)
  .map(console.log);
```

Now, that's about as basic as it gets. It's essentially one stop up from *Hello, World*. It may seem absurd, but this implementation always bothered me. For such a simple task, this implentation lacks a sort of elegance. It's also not generalized at all. Of course in the case of fizzbuzz, generalization isn't really the point. I mean, afterall this really just a test to make sure the programmer in question at least made it to page 2 in their copy of *Programming For Dummies*. However, in the professional world, we rarely have problems that have such specific and limited specs. In my experience, the brute force option will get you done faster, but will ensure that your solution doesn't scale as soon as your client/management changes their minds.

## Robustness though Abstraction

Whenever I'm given specifications, I'm immediately skeptical. The specs we're given are rarely the final product. Software specifications can be capricious, so the best option is to try and suss out the essence of the problem, which is the part that's least subject to change.

In the case of fizzbuzz, the essense of the problem is:

> For some number **N**, return **S<sub>0</sub>** if it is a multiple of **X**, otherwise return **N**

> For some number **N**, return **S<sub>0</sub>** &oplus; **S<sub>1</sub>** if **N** is a multiple of **X** and **Y**.

Okay, so the most generalized problem is that we need to make some function that will turn a number into a string if it is a multiple of a different number, and if we do it twice, and it's a multiple of both numbers, then we need to concatenate the strings. The fact that we're asked to do it from 1&ndash;100 is a feature, not the core problem.

## A First Draft

The optimal way to write this would be something like:

```javascript
// Looks nice, but won't work
buzz(fizz(2)); // 2
buzz(fizz(3)); // "Fizz"
buzz(fizz(5)); // "Buzz"
buzz(fizz(15)); // "FizzBuzz"
```

But how would one even implement that? Based on this draft it looks to me like both `fizz` and `buzz` take numbers and return either numbers or strings. `buzz(fizz(2))` and `buzz(fizz(5))` are both fine because `fizz` returns a number in both cases. `buzz(fizz(3))` would be "fine" if we had a special case for `buzz` being passed a string. But `buzz(fizz(15))` is a problem, because `fizz` destroyed the number it was given, so `buzz` has no way of knowing if it was a multiple of 5.

## Special Types

It looks like just numbers and strings aren't gunna cut it. So, lets make a new type:

```javascript
const Fizzer = (n) => ({
  value: n,
  text: ''
});
```

Okay, so now  we can keep track of the state of the numbers:

```javascript
const fizz = (f) => (
  f.value % 3 === 0
    ? Object.assign({}, f, { text: f.text + "Fizz" })
    : f
);

const buzz = (f) => (
  f.value % 5 === 0
    ? Object.assign({}, f, { text: f.text + "Buzz" })
    : f
);

buzz(fizz(Fizzer(2))); // { value: 2, text: '' }
buzz(fizz(Fizzer(3))); // { value: 3, text: 'Fizz' }
buzz(fizz(Fizzer(5))); // { value: 5, text: 'Buzz' }
buzz(fizz(Fizzer(15))); // { value: 15, text: 'FizzBuzz' }
```

But now, of course, there's a pattern here, so we can refactor:

```javascript
// a little bit of currying, because why not?
const fizzbuzzer = (div, text) => (fizzer) => {
  // It's getting annoying having to always type `Fizzer(x)`
  const f = fizzer.hasOwnProperty(value) ? fizzer : Fizzer(fizzer);
  return (
    f.value % div === 0
      ? Object.assign({}, f, { text: f.text + text })
      : f
  );
};

const fizz = fizzbuzzer(3, "Fizz");
const buzz = fizzbuzzer(5, "Buzz");
```

The beauty of this is that now the `fizzbuzzer` implementation is completely divisor and text agnostic. We could just keep adding:

```javascript
const baz = fizzbuzzer(7, "Baz");
const borf = fizzbuzzer(13, "Borf");

borf(baz(buzz(fizz(7)))) // { value: 7: text: 'Baz' }
borf(baz(buzz(fizz(21)))) // { value: 21, text: 'FizzBaz' }
```

## Scalability

Okay, so this particular implementation is pretty good so far. It's generalized, agnostic, and composable. However, as more cases get added, it's going to become pretty unweildy. What if there were 10 cases? 20? That function call would get a little out of hand. Of course there's libraries like [Ramda](http://ramdajs.com/) that make function composition a breeze:

```javascript
import R from 'ramda';

const fizzbuzz = R.pipe(fizz, buzz, baz, borf);
fizzbuzz(65); // { value: 65, text: 'BuzzBorf' }
```

Well that's certainly much better. However, I feel like we've lost something in the readability here. It's not as clear from the definition of `fizzbuzz` what's happening. Even though it's terse, it's not *clear*.

## Copy the Nerd's Homework

When devising a suitable abstraction, it's sometimes a good idea to take some cues from the world of math. The world of mathematics is full of people solving the most abstract of problems, often just for the sake of their own curiosity (y'know, nerds). It's often a good place to look for abstractions. *Functors* are one such abstraction that seems to be infinitely useful, and I posit they'll be useful here. (Technically, I'm stealing this from Haskell, which I hear stole the idea from math nerds, but I can't confirm.)

The nice thing about Functors is that they give you a way to wrap up your values, and provide you an nice compoosable interface to mutate them. Since all Functors implement `map` we can just keep chaining along without fear of a runtime exception.

This works well for our scenario, because we need a way to mutate the values inside `Fizzer` without exposing too much, or destroying our nice composable interface.

Let's see how we could implement fizz buzz with Functors:

```javascript
// some convenience functions for readability
const when = (pred, f) => (n, text) => pred(n) ? f(text) : text;
const isMultiple = x => y => y % x === 0;
const concatString = s1 => s0 => s0 + s1;

// implementing the Functor
const Fizzer = (n, text) => ({
  map: f => Fizzer(n, f(n, text || '')),
  done: () => text && text.length > 0 ? text : n // get out of the functor
});

Fizzer(35)
  .map(when(isMultiple(3), concatString("Fizz")))
  .map(when(isMultiple(5), concatString("Buzz")))
  .map(when(isMultiple(7), concatString("Baz")))
  .map(when(isMultiple(13), concatString("Borf")))
  .done(); // "BuzzBazz"
```

Personally, I like this. It's really straight forward, and actually increases the flexibility of the implementation (which could come in handy when your boss/client has a last minute feature they want to add to the spec).

For instance, now the spec has changed, and you need to internationalize fizzbuzz. No problem!

```javascript
Fizzer(13)
  .map(fizzbuzz(3, "Fizz"))
  .map(fizzbuzz(5, "Buzz"))
  .map(fizzbuzz(7, "Baz"))
  .map(fizzbuzz(13, "Borf"))
  .map((n, text) => i18n(text))
  .done(); // "Το σκυλο μιλει, \"Μπορφ!\""
```

## Array of Sunshine

 The last part of the spec, was that it was supposed to print fizz buzz from 1-100, so let's do that. However, we know better than to just implement code exactly to the specifications. You're gunna finish all that work, and then your boss/client is going to say, "Oh, wait, actually, we want fizz buzz from 3 to 491". And what are you gunna say? "No problem! (if you pay me)"

```javascript
const range = (min, max) =>
  Array.from(Array(max - min + 1).keys(), x => x + min);

const fizzIt = n =>
  Fizzer(n)
    .map(fizzbuzz(3, "Fizz"))
    .map(fizzbuzz(5, "Buzz"))
    .map(fizzbuzz(7, "Baz"))
    .map(fizzbuzz(13, "Borf"));
    .done();

const fizzBuzz = (min, max) =>
  range(min, max)
    .map(fizzIt)
    .map(x => console.log(x));

fizzBuzz(1, 100);
```

## All done

Okay, so we've had some fun, some laughs and some tears, but in the end we wasted quite a bit of time over a trivial problem, and we need to wrap this up. Since the spec only said that we needed "Fizz" and "Buzz", that's all I have here. However, because I took the time to think about the most general problem, I know have a flexible api that can be extended pretty far without having to refactor. 

```javascript
// fizzbuzz.js

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
```

## A Word About Abstraction

Okay, so this was obviously overkill for fizzbuzz, but I hope you got something out of the excercise. Abstracting to the most general form of the problem can help us construct future-proof(ish) implementations. It's upfront effort that will allow you to be lazy later.

**However**, there is definitely a dark side to this. I've inhereted enough convoluted codebases in my time to know that not all abstraction is created equally. Some people will abstract a concept to the point of absurdity, and that doesn't help anyone. Abstraction should be *illuminating* not obscuring. Abstraction should allow *more* flexibility and composability, not less.

Sometimes, a less general implementation is better, because it illuminates the problem and solution better.

So, if your abstraction is hard to read and extend, **it's a shit abstraction** and you should go back to the drawing board before you get locked into it.

But, if you can strike that balance, then it will benefit you and your team in the long run.


