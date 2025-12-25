// Mock implementation of until-async for Jest CJS environment
module.exports = {
  until: async (conditionFn) => {
    // Simple implementation: wait until condition is true
    while (!conditionFn()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return Promise.resolve();
  },
};
