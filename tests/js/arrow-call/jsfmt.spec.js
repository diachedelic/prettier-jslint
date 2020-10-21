const errors = {
  espree: ["class-property.js"],
};

run_spec(__dirname, ["babel", "flow", "typescript"], {
  tabWidth: 4,
  trailingComma: "none",
  bracketSpacing: false,
  arrowParens: "always",
  errors,
});
