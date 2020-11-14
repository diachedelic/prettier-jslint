function replace_node(path, replacement) {
  path.stack[path.stack.length - 3][path.getName()] = replacement;
  path.stack[path.stack.length - 1] = replacement;
  return true;
}

function make_identifier(name) {
  return {
    type: "Identifier",
    name
  };
}

function make_method_chain(members, ...args) {
  return {
    type: "CallExpression",
    callee: members.reduce(function (result, name) {
      return (
        result === undefined
        ? make_identifier(name)
        : {
          type: "MemberExpression",
          object: result,
          computed: false,
          property: make_identifier(name)
        }
      );
    }, undefined),
    arguments: args
  };
}

function make_variable_declaration(kind, name, init) {
  return {
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        id: make_identifier(name),
        init
      }
    ],
    kind
  };
}

function make_string_literal(value) {
  return {
      type: "StringLiteral",
      extra: {
        rawValue: value,
        raw: "\"" + value.replace(/\n/g, "\\n") + "\""
      },
      value
  };
}

function make_import(identifier, source) {
  return {
      "type": "ImportDeclaration",
      "specifiers": [
          {
              "type": "ImportDefaultSpecifier",
              "local": identifier
          }
      ],
      "importKind": "value",
      "source": make_string_literal(source)
  };
}

function append_statement(statements, landmark, node) {
  landmark.has_trailing_empty_line = false;
  node.has_trailing_empty_line = true;
  const landmark_index = statements.indexOf(landmark);
  statements.splice(landmark_index + 1, 0, node);
}

function add_comments(node, comments = []) {
  function append(property_name, comments) {
    const all_comments = node[property_name] || [];
    all_comments.push(...comments);
    if (all_comments.length > 0) {
      node[property_name] = all_comments;
    }
  }
  append("comments", comments);
  append(
    "leadingComments",
    comments.filter((comment) => comment.leading)
  );
  append(
    "trailingComments",
    comments.filter((comment) => comment.trailing)
  );
}

function add_todo(node, message) {
  return add_comments(node, [{
    type: "CommentTodo",
    value: message,
    leading: true
  }]);
}

function some_child(node, fn) {
  function call_if_node(node) {
    if (node && typeof node.type === "string") {
      return fn(node);
    }
  }

  return Object.keys(node).some(function (key) {
    return (
      Array.isArray(node[key])
      ? node[key].some(call_if_node)
      : call_if_node(node[key])
    );
  });
}

function defines_new_this(node) {
  const defines_another_this = [
    "ClassExpression",
    "ClassDeclaration",
    "ObjectMethod",
    "FunctionDeclaration",
    "FunctionExpression"
  ];
  return defines_another_this.includes(node.type);
}

function uses_this(node) {
  return (
    node.type === "ThisExpression"
    ? true
    : (
      defines_new_this(node)
      ? false
      : some_child(node, uses_this)
    )
  );
}

module.exports = Object.freeze({
  replace_node,
  make_identifier,
  make_method_chain,
  make_variable_declaration,
  make_string_literal,
  make_import,
  append_statement,
  add_comments,
  add_todo,
  some_child,
  defines_new_this,
  uses_this,
});
