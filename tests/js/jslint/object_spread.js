func(Object.assign({
  thing: true,
  stuff: {}
}, opts));

func({
  thing: true,
  stuff: {},

  /* boo-related */

  ...opts,

  boo() {
    return {
      ...thing()
    };
  },

  /* tail comment */
});

const x = {
  ...foo,
  bar,
  ...baz
};

const y = {
  hello: true,
  ...({
    goodbye: false,
    ...x
  })
}
