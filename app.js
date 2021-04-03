const { handler } = require("./index");
const run = async () => {
  console.time("test");
  await handler();
  console.log("yea");
  console.timeEnd("test");
};

run();
