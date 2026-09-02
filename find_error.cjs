const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
const script = scriptMatches[1][1];

// どこで構文エラーになっているか、末尾を削りながら確認
let min = 0, max = script.length;
while (min < max) {
  let mid = Math.floor((min + max) / 2);
  let chunk = script.slice(0, mid);
  let hasError = false;
  try {
    new Function(chunk);
  } catch (e) {
    if (e.message.includes("Unexpected token '}'")) {
      max = mid;
      hasError = true;
    } else {
      min = mid + 1;
    }
  }
  if (!hasError) {
    min = mid + 1;
  }
}

console.log('Error found near index:', max);
console.log('Context before:');
console.log(script.slice(Math.max(0, max - 200), max));
console.log('Context after:');
console.log(script.slice(max, Math.min(script.length, max + 200)));
