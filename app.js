const { handler } = require("./index");
const run = async () => {
  console.time("test");
  await handler();
  console.timeEnd("test");
};

run();
