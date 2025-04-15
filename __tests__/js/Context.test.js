'use strict'

const Context = require('js/Context');

test('Should accept bindings', () => {
    let context = new Context({ a: 5 });
    expect(context.get('a')).toBe(5);
    expect(context.get('b')).toBeNull();
});

test('Should find defaults', () => {
    let defaults = new Context({ a: 5 });
    let context = new Context({}, defaults);
    expect(context.get('a')).toBe(5);
});

test('Should respect overridden defaults', () => {
    let defaults = new Context({ a: 5 });
    let context = new Context({ a: 17}, defaults);
    expect(context.get('a')).toBe(17);
});

test('Should support nested properties', () => {
    let context = new Context({ a: { b: 5 } });
    expect(context.get('a.b')).toBe(5);
});
