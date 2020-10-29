"use strict";

const FastPath = require("../common/fast-path");

function replace_node(path, replacement) {
  path.stack[path.stack.length - 3][path.getName()] = replacement;
  path.stack[path.stack.length - 1] = replacement;
  return true;
}

function make_method_chain(members, args) {
  return {
    type: "CallExpression",
    callee: members.reduce(function (result, name) {
      const id = {
        type: "Identifier",
        name
      };
      return (
        result === undefined
        ? id
        : {
          type: "MemberExpression",
          object: result,
          computed: false,
          property: id
        }
      );
    }, undefined),
    arguments: args
  };
}

function add_comments(node, comments = [], trailing = false) {
  function append(node, property_name, comments) {
    const all_comments = node[property_name] || [];
    all_comments.push(...comments);
    if (all_comments.length > 0) {
      node[property_name] = all_comments;
    }
  }
  append(node, "comments", comments);
  append(
    node,
    "leadingComments",
    comments.filter((comment) => comment.leading)
  );
  append(
    node,
    "trailingComments",
    comments.filter((comment) => comment.trailing)
  );
}

function uses_this(node) {
  if (!node || typeof node.type !== "string") {
    // not a node
    return false;
  }

  const defines_another_this = [
    "ClassMethod",
    "ClassPrivateMethod",
    "ObjectMethod",
    "FunctionDeclaration",
    "FunctionExpression"
  ];

  if (defines_another_this.includes(node.type)) {
    return false;
  }

  if (node.type === "ThisExpression") {
    return true;
  }

  // recurse
  return Object.keys(node).some(function (key) {
    return (
      Array.isArray(node[key])
      ? node[key].some(uses_this)
      : uses_this(node[key])
    );
  });
}

// Transformers.

function freeze_exports(path) {
  const node = path.getValue();
  if (node.type === "ExportDefaultDeclaration") {
    const the_export = node.declaration;
    if (
      the_export.type !== "CallExpression" ||
      !(
        (
          the_export.callee.type === "MemberExpression" &&
          the_export.callee.property.name === "freeze"
        ) || (
          the_export.callee.type === "Identifier" &&
          the_export.callee.name === "stone"
        )
      )
    ) {
      if (the_export.type === "FunctionDeclaration") {
        the_export.type = "FunctionExpression";
      }

      // freeze export
      node.declaration = {
        type: "CallExpression",
        arguments: [the_export],
        callee: {
          type: "MemberExpression",
          computed: false,
          object: {
            type: "Identifier",
            name: "Object"
          },
          property: {
            type: "Identifier",
            name: "freeze"
          }
        }
      };

      return true;
    }
  }
}

function replace_object_spread(path) {
  const node = path.getValue();
  if (
    node.type === "ObjectExpression" &&
    node.properties.some((prop) => prop.type === "SpreadElement")
  ) {
    const assign_args = node.properties.reduce(function (args, prop, prop_nr) {
      if (prop_nr === 0) {
        if (prop.type === "SpreadElement") {
          args.push({
            type: "ObjectExpression",
            properties: []
          });
        }
      } else {
        // Amalgamate properties.
        if (
          prop.type !== "SpreadElement" &&
          node.properties[prop_nr - 1].type !== "SpreadElement"
        ) {
          const obj = args[args.length - 1];
          obj.properties.push(prop);
          return args;
        }
      }
      if (prop.type === "SpreadElement") {
        add_comments(prop.argument, prop.leadingComments);
        return args.concat(prop.argument);
      }

      return args.concat({
        type: "ObjectExpression",
        properties: [prop],
        force_break: true
      });
    }, []);

    return replace_node(
      path,
      make_method_chain(["Object", "assign"], assign_args)
    );
  }
}

function replace_arrow_function(path) {
  const node = path.getValue();
  if (
    node.type === "ArrowFunctionExpression" &&
    node.body &&
    node.body.type === "BlockStatement" &&
    !uses_this(node)
  ) {
    node.type = "FunctionExpression";
    return replace_node(path, node);
  }

  if (
    node.type === "VariableDeclaration" &&
    node.kind === "const" &&
    node.declarations.length === 1 &&
    node.declarations[0].init &&
    node.declarations[0].init.type === "FunctionExpression"
  ) {
    const function_declaration = node.declarations[0].init;
    function_declaration.type = "FunctionDeclaration";
    function_declaration.id = node.declarations[0].id;
    add_comments(function_declaration, node.comments);
    return replace_node(path, function_declaration);
  }

  if (
    node.type === "ArrowFunctionExpression" &&
    node.body &&
    node.body.type !== "BlockStatement" &&
    node.params.some((param) => param.type === "ObjectPattern") &&
    !uses_this(node)
  ) {
    node.type = "FunctionExpression";
    node.body = {
      type: "BlockStatement",
      body: [
        {
          type: "ReturnStatement",
          argument: node.body
        }
      ]
    };
    return replace_node(path, node);
  }
}

function traverse(path, mutator) {
  const node = path.getValue();
  if (!node || typeof node.type !== "string") {
    // Not a node.
    return false;
  }
  if (mutator(path)) {
    return true;
  }
  return Object.keys(node).some(function (key) {
    if (Array.isArray(node[key])) {
      let did_mutate = false;
      path.each(function (child_path) {
        if (traverse(child_path, mutator)) {
          did_mutate = true;
        }
      }, key);
      return did_mutate;
    }
    return path.call(function (child_path) {
      return traverse(child_path, mutator);
    }, key);
  });
}

function transform_tree(ast) {
  const transforms = [
    replace_object_spread,
    freeze_exports,
    replace_arrow_function
  ];
  const path = new FastPath(ast);
  return (
    transforms.some(function (transform) {
      return traverse(path, transform);
    })
    ? transform_tree(ast)
    : undefined
  );
}

function preprocess(ast, options) {
  transform_tree(ast);


  const keys_to_ignore = [
      "tokens",
      "start",
      "end",
      "loc",
      "range"
  ];
  function replacer(key, value) {
      return (
          keys_to_ignore.includes(key)
          ? undefined
          : value
      );
  }
  // console.log(JSON.stringify(ast, replacer, "    "));
  // return process.exit(1);

  switch (options.parser) {
    case "json":
    case "json5":
    case "json-stringify":
    case "__js_expression":
    case "__vue_expression":
      return {
        ...ast,
        type: options.parser.startsWith("__") ? "JsExpressionRoot" : "JsonRoot",
        node: ast,
        comments: [],
        rootMarker: options.rootMarker,
      };
    default:
      return ast;
  }
}

module.exports = preprocess;
