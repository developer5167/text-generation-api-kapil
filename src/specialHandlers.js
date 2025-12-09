const specialHandlers = [];

class SpecialHandler {
  canHandle(question) {
    throw new Error('Method not implemented');
  }
  
  handle(question) {
    throw new Error('Method not implemented');
  }
}

function registerSpecialHandler(handler) {
  specialHandlers.push(handler);
  console.log("specialHandlers:"+specialHandlers);
  
}

function processSpecialHandlers(question) {
  for (const handler of specialHandlers) {
    if (handler.canHandle(question)) {
      return handler.handle(question);
    }
  }
  return null;
}

module.exports = {
  SpecialHandler,
  registerSpecialHandler,
  processSpecialHandlers
};