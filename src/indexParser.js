// utils/indexParser.js

// Matches: "2", "2 and 4", "1,3,5", "first", "second", "last", "third"
function extractIndexes(message, listLength) {
  message = message.toLowerCase();

  const wordToIndex = {
    "first": 1,
    "second": 2,
    "third": 3,
    "fourth": 4,
    "fifth": 5,
    "last": listLength
  };

  let slots = {};
  let indexes=[];

  // Word-based indexes
  for (const word in wordToIndex) {
    if (word === "last" && !listLength) continue;
    if (message.includes(word)) {
      indexes.push(wordToIndex[word]);
    }
  }

  // Number-based detection
  const numbers = message.match(/\b\d+\b/g);
  if (numbers) {
    slots.indexes = numbers.map(n => parseInt(n, 10));
  }
  const groupCodeMatch = message.match(/[a-zA-Z]+[a-zA-Z0-9]*-?[0-9]+/g);

  // Filter out simple words accidentally matched
  if (groupCodeMatch) {
    const validCodes = groupCodeMatch.filter(code =>
      code.length > 3 && /\d/.test(code) // must contain numbers
    );
    if (validCodes.length > 0) {
      slots.groupCode = validCodes[0].toUpperCase(); // store first match
    }
  }

  return Object.keys(slots).length > 0 ? slots : null;
}


module.exports = { extractIndexes };
