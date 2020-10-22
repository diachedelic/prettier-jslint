const errors = {
  espree: ["class-property.js"],
};

run_spec(__dirname, ["babel", "flow", "typescript"], {errors});
