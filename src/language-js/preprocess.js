"use strict";

const FastPath = require("../common/fast-path");
const {
  replace_node,
  make_identifier,
  make_method_chain,
  make_variable_declaration,
  make_string_literal,
  make_import,
  make_concat,
  append_statement,
  add_comments,
  add_todo,
  some_child,
  defines_new_this,
  uses_this
} = require("./jslint.js");

// Returns the identifier for the imported module.
function add_import(path, desired_identifier, source) {
  const statements = path.stack[0].program.body;
  const existing = statements.find(function (node) {
    return (
      node.type === "ImportDeclaration" &&
      node.source.value === source
    );
  });
  if (
    existing &&
    existing.specifiers.length === 1 &&
    existing.specifiers[0].type === "ImportDefaultSpecifier"
  ) {
    return existing.specifiers[0].local;
  }
  const last_import = statements.reduce(function (found, node, node_nr) {
    if (node.type === "ImportDeclaration") {
      return node;
    }
    return found;
  }, undefined);
  if (last_import === undefined) {
    // throw new Error("Could not find an import list to append to.");
    // Rely on an undeclared identifier warning.
    return desired_identifier;
  }
  const the_import = make_import(desired_identifier, source);
  last_import.has_trailing_empty_line = false;
  the_import.has_trailing_empty_line = true;
  append_statement(
    statements,
    last_import,
    the_import
  );
  return desired_identifier;
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
          object: make_identifier("Object"),
          property: make_identifier("freeze")
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
      make_method_chain(["Object", "assign"], ...assign_args)
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

function clarify_regex(path) {
  const node = path.getValue();
  if (
    node.type === "RegExpLiteral"
  ) {
    const clarified_pattern = node.pattern.replace(
      // Replace spaces with \s.
      new RegExp(" ", "g"),
      "\\s"
    ).replace(
      // Escape any unescaped forward slashes.
      /(?<!\\)\//g, "\\/"
    );

    if (clarified_pattern === node.pattern) {
      return false;
    }

    node.pattern = clarified_pattern;
    return replace_node(path, node);
  }
}

function shorten_comments(path) {
  const node = path.getValue();
  if (
    node.type === "CommentLine" ||
    node.type === "CommentBlock"
  ) {
    const value = node.value.replace(
      /\bhttps:\/\/stackoverflow\.com\/questions\/(\d+)(\/[^\s]+)?/g,
      "https://stackoverflow.com/q/$1"
    );

    if (value === node.value) {
      return false;
    }
    node.value = value;
    return replace_node(path, node);
  }
}

function replace_megastrings(path) {
  const node = path.getValue();
  if (
    node.type === "TemplateLiteral" &&
    path.getParentNode().type !== "TaggedTemplateExpression" &&
    !node.quasis.some(
      (quasis) => quasis.value.cooked.split("\n").slice(1).some(
        // Check for indentation - usually a sign we should leave this
        // template literal alone.
        (part) => part.startsWith(" ")
      )
    )
  ) {
    if (node.expressions.length === 0) {
      return replace_node(
        path,
        make_string_literal(node.quasis[0].value.cooked)
      );
    }
    if (
      node.expressions.length === 1 &&
      node.quasis[1].value.cooked === ""
    ) {
      return replace_node(path, make_concat(
        make_string_literal(node.quasis[0].value.cooked),
        node.expressions[0]
      ));
    }
    if (
      node.expressions.length === 1 &&
      node.quasis[0].value.cooked === ""
    ) {
      return replace_node(path, make_concat(
        node.expressions[0],
        make_string_literal(node.quasis[1].value.cooked)
      ));
    }
    if (
      node.expressions.length === 2 &&
      node.quasis[0].value.cooked === "" &&
      node.quasis[2].value.cooked === ""
    ) {
      return replace_node(path, make_concat(
        make_concat(
          node.expressions[0],
          make_string_literal(node.quasis[1].value.cooked)
        ),
        node.expressions[1]
      ));
    }

    const fulfill_identifier = add_import(
      path,
      make_identifier("fulfill"),
      process.env.JSLINT_FULFILL_SOURCE || "@douglascrockford/fulfill.js"
    );
    const call = {
      "type": "CallExpression",
      "callee": fulfill_identifier,
      "arguments": [
          make_string_literal(
            node.quasis.reduce(function (string, quasis, quasis_nr) {
              const part = quasis.value.cooked;
              return (
                string === undefined
                ? part
                : string + "{" + String(quasis_nr - 1) + "}" + part
              );
            }, undefined)
          ),
          {
              "type": "ArrayExpression",
              "elements": node.expressions
          }
      ]
    };
    return replace_node(path, call);
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
    replace_arrow_function,
    clarify_regex,
    shorten_comments,
    replace_megastrings
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
