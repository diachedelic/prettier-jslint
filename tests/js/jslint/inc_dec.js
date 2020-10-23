let a = i++;
a = i--;
a = ++i;
a = --i;

i++;
++i;

if (true) {
  i--;
  --i;
}

function one() {
  return --i;
}
function two() {
  return i--;
}
function three() {
  return ++i;
}
function found() {
  return i++;
}

for (let i = Things.length - 1; i >= 0; i--) {
  Things[i] += 1;
  Things[i] -= 1;

  b++;
  c = --d;
}

stuff (a++);

while(a++) {
  bar();
}
