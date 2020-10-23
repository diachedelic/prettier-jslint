object.foo().bar.boo.baz();

foo((stuff) => true);
bar.foo((stuff) => true);

domain
    .concept("Page")
    .val("title", "string")
    .vals("widgets", "Widget")
    .val("title", "string")
    .val("color", "Color")
    .val("foo", "Foo")
    .val("bar", "Bar");

domain
    .val(() => true)
    .concept("Page");

foo()
  .bar()
  .baz()
  .baz()
  .baz()
  .baz();

foo()
  .bar()
  .baz()
  .baz()
  .baz("Hi")
  .baz();

foo().bar.baz();

Something
  // I got a thing
  .getInstance(this.props.dao)
  // You got a thing
  .getters()

// Warm-up first
measure()
  .then(() => {
    SomethingLong();
  });

measure() // Warm-up first
  .then(() => {
    SomethingLong();
  });

angular.module('AngularAppModule')
  // Hello, I am comment.
  .constant('API_URL', 'http://localhost:8080/api');

client.execute(
Post.selectAll()
  .where(Post.id.eq(42))
  .where(Post.published.eq(true))
);

[].forEach(key => {
  data('foo')
    [key]('bar')
    .then(() => console.log('bar'))
    .catch(() => console.log('baz'));
});

cy.get('option:first')
  .should('be.selected')
  .and('have.value', 'Metallica')

domain
    .concept('Page')
    .val('title', 'string')
    .vals('widgets', 'Widget')
    .val('title', 'string')
    .val('color', 'Color')
    .val('foo', 'Foo')
    .val('bar', 'Bar');

const palindrome = str => {
  const s = str.toLowerCase().replace(/[\W_]/g, '');
  return s === s.split('').reverse().join('');
};

action$.ofType(ActionTypes.SEARCHED_USERS)
  .map(action => action.payload.query)
  .filter(q => !!q)
  .switchMap(q =>
    Observable.timer(800) // debounce
      .takeUntil(action$.ofType(ActionTypes.CLEARED_SEARCH_RESULTS))
      .mergeMap(() =>
        Observable.merge(
          Observable.of(replace(`?q=${q}`)),
          ajax
            .getJSON(`https://api.github.com/search/users?q=${q}`)
            .map(res => res.items)
            .map(receiveUsers)
        )
      )
  );

wrapper.find('SomewhatLongNodeName').prop('longPropFunctionName', 'second argument that pushes this group past 80 characters')('argument').then(function() {
  doSomething();
});

of("test")
  .concept('Page')
  .val('title', 'string')
  .vals('widgets', 'Widget')
  .subscribe({
    foo() {
      bar();
    }
  })
  .val('title', 'string')
  .val('color', 'Color')
  .pipe(throwIfEmpty())
  .subscribe({
    get foo() {
      bar();
    }
  });

const sel = this.connections
  .concat(this.activities.concat(this.operators))
  .filter(x => x.selected);
