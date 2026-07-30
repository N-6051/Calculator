class ExpressionParser {
  constructor(calc) {

    this.calc = calc;

    this.CONSTANTS = {
      pi: "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273",
      e: calc.exp("1")
    };

    this.OPERATORS = {
      "+": {
        precedence: 1,
        assoc: "L",
        args: 2,
        fn: (a, b) => this.calc.add(a, b)
      },
      "-": {
        precedence: 1,
        assoc: "L",
        args: 2,
        fn: (a, b) => this.calc.subtract(a, b)
      },
      "*": {
        precedence: 2,
        assoc: "L",
        args: 2,
        fn: (a, b) => this.calc.multiply(a, b)
      },
      "/": {
        precedence: 2,
        assoc: "L",
        args: 2,
        fn: (a, b) => this.calc.divide(a, b)
      },
      "%": {
        precedence: 2,
        assoc: "L",
        args: 2,
        fn: (a, b) => this.calc.percent(a, b)
      },
      "^": {
        precedence: 3,
        assoc: "R",
        args: 2,
        fn: (a, b) => this.calc.pow(a, b)
      },

      "sin": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.sin(a)
      },
      "cos": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.cos(a)
      },
      "tan": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.tan(a)
      },
      "asin": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.arcsin(a)
      },
      "acos": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.arccos(a)
      },
      "atan": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.arctan(a)
      },
      "sinh": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.sinh(a)
      },
      "cosh": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.cosh(a)
      },
      "tanh": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.tanh(a)
      },
      "asinh": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.asinh(a)
      },
      "acosh": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.acosh(a)
      },
      "atanh": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.atanh(a)
      },
      "log": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.log(a)
      },
      "ln": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.ln(a)
      },
      "exp": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.exp(a)
      },
      "sqrt": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => this.calc.sqrt(a)
      },
      "!": {
        precedence: 5,
        assoc: "L",
        args: 1,
        fn: (a) => this.calc.factorial(a),
        postfix: true
      },

      // IMPORTANT: lower precedence than ^
      "neg": {
        precedence: 3,
        assoc: "R",
        args: 1,
        fn: (a) => "-"+a
      }
    };
  }

  init() {
    this.CONSTANTS.phi = this.calc.divide(this.calc.add("1", this.calc.sqrt("5")), "2");
    this.CONSTANTS.tau = this.calc.multiply(this.CONSTANTS.pi, "2");
    this.CONSTANTS.tauReciprocal = this.calc.divide("1", this.CONSTANTS.tau, this.CONSTANTS.tau.length - 3);
    this.CONSTANTS.RADIANS_FACTOR = this.calc.divide(this.CONSTANTS.pi, "180", this.CONSTANTS.pi.length - 3);
    this.CONSTANTS.RADIANS_FACTOR_RECIPROCAL = this.calc.divide("1", this.CONSTANTS.RADIANS_FACTOR, this.CONSTANTS.RADIANS_FACTOR.length);
    this.CONSTANTS.log10 = this.calc.ln("10");
    this.CONSTANTS.log10_RECIPROCAL = this.calc.divide("1", this.CONSTANTS.log10);

  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  buildRegex() {
    const fnNames = Object.keys(this.OPERATORS)
    .filter(k => isNaN(k))
    .map(n => this.escapeRegex(n))
    .sort((a, b) => b.length - a.length);

    const constNames = Object.keys(this.CONSTANTS)
    .map(n => this.escapeRegex(n))
    .sort((a, b) => b.length - a.length);

    const namesPattern = [...fnNames,
      ...constNames].join("|");

    return new RegExp(
      `\\d+(\\.\\d+)?|${namesPattern}|\\^|[+\\-*/()]|\\S`,
      "g"
    );
  }

  tokenize(expr) {
    expr = expr
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/φ/g, "phi")
    .replace(/√/g, "sqrt")
    .replace(/,/g, "")
    //.replace(/%/g, "/100*")


    const rawNames = [
      ...Object.keys(this.CONSTANTS),
      ...Object.keys(this.OPERATORS).filter(k => isNaN(k))
    ];

    const constNames = Object.keys(this.CONSTANTS)
    .map(n => this.escapeRegex(n))
    .join("|");

    expr = expr.replace(/(\d|\))\(/g, "$1*(");

    if (constNames) {
      expr = expr.replace(
        new RegExp(`(\\d|\\))(?=${constNames})`, "g"),
        "$1*"
      );
    }

    if (constNames) {
      expr = expr.replace(
        new RegExp(`(${constNames})(?=\\d|\\()`, "g"),
        "$1*"
      );
    }


    const tokens = expr.match(this.buildRegex());
    const result = [];

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];

      if (token === "-") {
        let prev = result[result.length - 1];

        if (
          i === 0 ||
          (prev in this.OPERATORS) ||
          prev === "("
        ) {
          if (this.OPERATORS[prev]) {
            if (this.OPERATORS[prev].postfix) {
              result.push("-");
              continue;
            }
          }
          result.push("neg");
          continue;
        }
      }

      result.push(token);
    }

    return result;
  }

  infixToRPN(tokens) {
    const output = [];
    const stack = [];

    for (let token of tokens) {
      if (Number.isFinite(+token)) {
        output.push(token);
      } else if (token in this.CONSTANTS) {
        output.push(token);
      } else if (token in this.OPERATORS) {
        const o1 = this.OPERATORS[token];

        while (stack.length) {
          const top = stack.at(-1);
          const o2 = this.OPERATORS[top];

          if (!o2) break;

          if (
            (o1.assoc === "L" && o1.precedence <= o2.precedence) ||
            (o1.assoc === "R" && o1.precedence < o2.precedence)
          ) {
            output.push(stack.pop());
          } else break;
        }

        stack.push(token);
      } else if (token === "(") {
        stack.push(token);
      } else if (token === ")") {
        while (stack.length && stack.at(-1) !== "(") {
          output.push(stack.pop());
        }

        if (!stack.length) throw new Error("Mismatched parentheses");

        stack.pop();


        if (
          stack.length &&
          this.OPERATORS[stack.at(-1)]?.args === 1
        ) {
          output.push(stack.pop());
        }
      }
    }

    while (stack.length) {
      const op = stack.pop();
      if (op === "(") throw new Error("Mismatched parentheses");
      output.push(op);
    }

    return output;
  }

  evalRPN(rpn) {
    const stack = [];

    for (let token of rpn) {
      if (Number.isFinite(+token)) {
        stack.push(token);
      } else if (token in this.CONSTANTS) {
        stack.push(this.CONSTANTS[token]);
      } else {
        const op = this.OPERATORS[token];
        if (!op) throw new Error("Unknown token: " + token);

        if (op.args === 1) {
          if (stack.length < 1) throw new Error("Invalid expression");
          const a = stack.pop();
          stack.push(op.fn(a));
        } else {
          if (stack.length < 2) throw new Error("Invalid expression");
          const b = stack.pop();
          const a = stack.pop();
          stack.push(op.fn(a, b));
        }
      }
    }

    if (stack.length !== 1) throw new Error("Invalid expression");

    return stack[0];
  }

  evaluate(expr) {
    if (!expr) return;
    const tokens = this.tokenize(expr);
    const rpn = this.infixToRPN(tokens);
    return this.evalRPN(rpn);
  }
}

class number {

  constructor(int = "0", frac = "0") {
    this.int = int;
    this.frac = frac;
    this.str = int+"."+frac;
  }

  copy() {
    return new number(this.int, this.frac);
  }

}

class PI {

  constructor(calc, digits = 24) {
    this.digits = digits;
    this.calc = calc;
    this.idx = 0;
    //this.const = this.calc.divide(this.calc.sqrt("10005"), "4270934400");
    this.const = "0.00000002341993285492303650105049327762041439962061331794192733494935243436447252710421033212572591808012160003094261746786983689333440356924943616626680360198508366423921682067310037640243231143552280649869022897608824642317471599288274855870770031861074616082140578077723157931066774821667745416974736616065958201868779730318345258228413139179628023675133127418420666842870624372930735089238991780198329762269645620386465200449788149332096391921246711790901992090070350556558287100547871227972884999"
    this.sum = "0";
    this.VALUE = "0";

    for (let i = 0; i < 2; i++) {
      //this.sum = this.calc.add(this.sum, this.getTerm());
      // if(i==1) this.VALUE = this.calc.divide("1", this.calc.multiply(this.const, this.sum));
    }
  }

  getTerm() {
    let k = this.idx.toString();
    //let exp = `((-1)^${k}*(6*${k})!*(545140134*${k}+13591409))/((3*${k})!(${k}!)^3*(640320)^(3*${k}))`;
    //return this.calc.evaluate(exp)
    let val = this.calc.divide(this.calc.multiply(this.calc.multiply(this.calc.pow("-1", k), this.calc.factorial(this.calc.multiply("6", k))), this.calc.add(this.calc.multiply("545140134", k), "13591409")),
      this.calc.multiply(this.calc.multiply(this.calc.factorial(this.calc.multiply("3", k)), this.calc.pow(this.calc.factorial(k), "3")), this.calc.pow("640320", this.calc.multiply("3", k)))
    );

    this.sum = this.calc.add(this.sum, val);
    this.idx += 1;
    return val;
  }

  getVal() {
    this.VALUE = this.calc.divide("1", this.calc.multiply(this.const, this.sum));
    return this.VALUE;
  }

}

class LazyDivision {
  constructor(a, b, chunkSize = 5, PRECISION = 100) {

    this.divisor = b;
    this.remainder = a % b;
    this.base = 10n ** BigInt(chunkSize);
    this.chunkSize = chunkSize;
    this.generated = 0;
    this.result = a / b + (this.remainder ? ".": "");

    for (let i = 0; i < PRECISION; i += this.chunkSize) {
      this.nextChunk();
    }

  }

  nextChunk() {
    this.remainder *= this.base;
    if (this.remainder === 0n) return;
    let chunk = this.remainder / this.divisor;
    this.remainder %= this.divisor;
    this.generated += this.chunkSize;
    this.result += chunk.toString().padStart(this.chunkSize, "0");

  }

}

class Calculator {
  constructor(PRECISION = 100) {
    //this.parser = null;
    this.PRECISION = PRECISION;
    this.parser = new ExpressionParser(this);

    this.RADIANS = true;
    //this.RADIANS_FACTOR = this.divide(this.parser.CONSTANTS.pi, "180");
    /*this.CONSTANTS = {
      "pi": new PI(this)
    }*/

  }

  divide(a, b, precision = this.PRECISION) {

    if (this.isEqual(b, "1")) return a;

    let n1 = a.split(".");
    let n2 = b.split(".");
    if (!n1[1]) n1[1] = "0";
    if (!n2[1]) n2[1] = "0";

    let prefix = "";
    if (n1[0][0] == "-") {
      n1[0] = n1[0].slice(1);
      prefix += "-";
    } if (n2[0][0] == "-") {
      n2[0] = n2[0].slice(1);
      prefix += "-";
    } if (prefix == "--") {
      prefix = "";
    }

    if (n2[0] == "0" && n2[1] == "0") return;


    let diff = n1[1].length - n2[1].length; // sus
    if (diff > 0) {
      n2[1] += "0".repeat(diff);
    } else {
      n1[1] += "0".repeat(- diff);
    }

    let p1 = BigInt(n1[0] + n1[1]);
    let p2 = BigInt(n2[0] + n2[1]);

    let {
      result
    } = new LazyDivision(p1, p2, 12, precision);

    return prefix + result;

  }


  add(a, b) {
    let [i1,
      f1 = "0"] = a.split(".");
    let [i2,
      f2 = "0"] = b.split(".");

    let maxDecimals = Math.max(f1.length, f2.length);
    f1 = f1.padEnd(maxDecimals, "0");
    f2 = f2.padEnd(maxDecimals, "0");

    let num1 = BigInt(i1 + f1);
    let num2 = BigInt(i2 + f2);

    let sum = (num1 + num2).toString();

    let prefix = "";
    if (sum[0] == "-") {
      sum = sum.slice(1);
      prefix = "-";
    }

    let str;
    sum.length > maxDecimals ? str = prefix + sum.slice(0, - maxDecimals) + "." + sum.slice(- maxDecimals): str = prefix + "0." + sum.padStart(maxDecimals, "0");

    return str;

  }

  subtract(a, b) {
    let prefix = "-";
    if (b[0] == "-") {
      b = b.slice(1);
      prefix = "";
    }
    return this.add(a, prefix + b);
  }

  percent(a, b) {
    let [n = "1",
      m = "1"] = [a,
      b];
    return this.divide(this.multiply(n, m), "100");
  }

  addDecimal(num, dec) {
    if (!dec) return num;

    let prefix = "";
    if (num[0] == "-") {
      num = num.slice(1);
      prefix = "-";
    }

    if (dec < num.length) {
      return prefix + num.slice(0, - dec) + "." + num.slice(- dec);
    } else {
      return prefix + "0." + num.padStart(dec, "0");
    }
  }

  multiply(a, b) {
    let [i1,
      f1 = "0"] = a.split(".");
    let [i2,
      f2 = "0"] = b.split(".");

    let prefix = "";
    if (i1[0] == "-") {
      i1 = i1.slice(1);
      prefix = "-";
    } if (i2[0] == "-") {
      i2 = i2.slice(1);
      prefix === "-" ? prefix = "": prefix = "-";
    }

    let b1 = BigInt(i1);
    let b2 = BigInt(i2);

    let k1 = this.add(
      (b1 * b2).toString(),
      this.addDecimal(
        (b1 * BigInt(f2)).toString(),
        f2.length
      )
    );
    let k2 = this.add(
      this.addDecimal(
        (b2 * BigInt(f1)).toString(),
        f1.length
      ),
      this.addDecimal(
        (BigInt(f1) * BigInt(f2)).toString(),
        f1.length + f2.length
      )
    );

    return prefix + this.add(k1, k2);

  }

  factorial(x) {
    let result = 1n;
    for (let i = Math.floor(x); i > 0; i--) {
      result *= BigInt(i);
    }
    return result.toString();
  }

  isZero(num) {
    let k = num.split(".");
    let int = BigInt(k[0]);
    let frac;
    k[1] ? frac = BigInt(k[1]): frac = 0n;
    return !int && !frac;
  }

  exp(x) {

    if (this.isZero(x)) return "1";

    let result = "1";
    let pow = 1;
    let term = "1";

    while (true) {
      term = this.divide(this.multiply(x, term), pow.toString());

      let f = term.split(".")[1];
      if (f) {
        let match = f.match(/^0+/);
        let digits;
        match ? digits = match[0].length: digits = 0;
        if (digits >= this.PRECISION) break;
      }

      result = this.add(term, result);
      pow += 1;

    }


    return result;

  }

  pow(a, b) {
    if (b === "0") return "1";
    if (a === "1") return "1";
    if (a === "0") return "0";
    if (a === this.parser.CONSTANTS.e) {
      return this.exp(b);
    }

    let neg = b[0] === "-";
    if (neg) b = b.slice(1);

    let sArr = b.split(".");

    if (!sArr[1]) {
      let base = BigInt(a.replace(".", ""));
      let result = 1n;
      let exp = BigInt(b);
      while (exp > 0n) {
        if (exp % 2n) result *= base;
        base *= base;
        exp /= 2n;
      }


      let str = result.toString();
      let frac = a.split(".")[1];
      if (frac) {
        let maxDecimals = frac.length * b;
        let intBase = a.split(".")[0];
        let prefix = "";
        if (str[0] == "-") {
          str = str.slice(1);
          prefix = "-";
        }

        if (str.length > maxDecimals) {
          result = prefix + str.slice(0, - maxDecimals) + "." + str.slice(- maxDecimals);
        } else {
          result = prefix + "0." + str.padStart(maxDecimals, "0");
        }


      } else {
        result = str;
      }
      return (neg ? this.divide("1", result): result);
    } else {
      let result = this.multiply(
        this.exp(this.multiply("0."+sArr[1], this.ln(a))),
        this.pow(a, sArr[0])
      );
      return (neg ? this.divide("1", result): result);

    }
  }

  ln(x) {

    if (this.isEqual(x, "1")) return "0";

    let prefix = "";
    if (x[0] == "0") {
      prefix = "-";
      x = this.divide("1", x);
    }



    let x0 = Math.log(parseFloat(x)).toString();

    if (x0.includes("e")) x0 = this.NormalFromScientific(x);
    if (x0 == "Infinity") x0 = "709";

    let xn;

    while (true) {
      xn = this.add(this.subtract(x0, "1"), this.divide(x, this.exp(x0)));

      let frac = this.subtract(xn, x0).split(".")[1];
      let match = frac.match(/^0+/);
      let digits;
      match ? digits = match[0].length: digits = 0;
      if (digits >= this.PRECISION) break;

      x0 = xn;

    }

    return prefix + xn;

  }

  lnVer2(x) {
    return this.multiply(this.atanh(this.divide(this.subtract(x, "1"), this.add(x, "1"))), "2");
  }

  log(x) {
    return this.fix(this.multiply(this.ln(x), this.parser.CONSTANTS.log10_RECIPROCAL));
  }

  isEqual(n1, n2) {
    return this.stripTrailingZeros(n1) === this.stripTrailingZeros(n2);
  }

  nthRoot(x, n) {
    let initial = Math.ceil(Math.pow(parseFloat(x), 1/n));
    let x0 = initial.toString();

    if (initial == Infinity) x0 = this.pow(x, (1/n).toString())

    x0 = this.NormalFromScientific(x0);

    if (this.pow(x0, n.toString()) === x) return x0;
    let xn = null;


    let MAX = 10000;
    let iterations = 0;



    let f,
    fp,
    fpp;
    while (true && iterations < MAX) {
      iterations++;

      f = this.subtract(this.pow(x0, n.toString()), x);
      fp = this.multiply(n.toString(), this.pow(x0, (n - 1).toString()));
      fpp = this.multiply((n * (n - 1)).toString(), this.pow(x0, (n - 2).toString()));

      xn = this.subtract(
        x0,
        this.divide(
          this.multiply(f, fp),
          this.subtract(this.pow(fp, "2"), this.divide(this.multiply(f, fpp), "2"))
        )
      );

      let frac = this.subtract(xn, x0).split(".")[1];
      let match = frac.match(/^0+/);
      let digits;
      match ? digits = match[0].length: digits = 0;
      if (digits >= this.PRECISION) break;

      x0 = xn;

    }

    return xn;
  }

  sin(x, isRadian = this.RADIANS) {
    if (this.isEqual(x, "0")) return "0";
    let prefix;
    if (x[0] == "-") {
      prefix = "-";
      x = x.slice(1);
    }
    if (!isRadian) {
      x = this.radians(x);
    } else {
      x = this.reduceAngle(x, true);
    }



    let MAX = 10000;
    let iterations = 0;
    let n = 1;
    let term = x;
    let sum = term;
    let old_sum = "0";
    let neg = "-";

    while (true && iterations < MAX) {
      iterations++;


      term = this.divide(this.multiply(term, this.square(x)), ((n+1)*(n+2)).toString());
      sum = this.add(sum, neg + term);

      n += 2;

      neg == "-" ? neg = "": neg = "-";

      if (this.isPrecise(sum, old_sum, this.PRECISION)) {
        break;
      }

      old_sum = sum;

    }

    if (prefix) {
      sum[0] == "-" ? sum = sum.slice(1): sum = "-" + sum;
    }

    return this.fix(sum.slice(0, this.PRECISION + 7));

  }

  arcsin(x) {
    let prefix = "";
    if (x[0] == "-") {
      x = x.slice(1);
      prefix = "-";
    }

    if (this.isEqual(x, "1")) {
      if (!this.RADIANS) return "90";
      return prefix + this.divide(this.parser.CONSTANTS.pi, "2");
    }

    let MAX = 1000;
    let iterations = 0;
    let x0 = Math.asin(x).toString();
    let xn;

    while (true && iterations < MAX) {
      iterations++;

      xn = this.subtract(x0, this.divide(this.subtract(this.sin(x0, true), x), this.cos(x0, true)));

      if (this.isPrecise(xn, x0, this.PRECISION)) break;

      x0 = xn;

    }


    if (!this.RADIANS) return prefix + this.fix(this.degrees(xn));
    return prefix + xn;

  }
  arccos(x) {
    let prefix = "";
    if (x[0] == "-") {
      x = x.slice(1);
      prefix = "-";
    }

    if (this.isEqual(x, "0")) {
      if (!this.RADIANS) return "90";
      return prefix + this.divide(this.parser.CONSTANTS.pi, "2");
    } else if (this.isEqual(x, "1")) {
      return "0";
    }

    let MAX = 1000;
    let iterations = 0;
    let x0 = Math.acos(x).toString();
    let xn;

    while (true && iterations < MAX) {
      iterations++;

      xn = this.add(x0, this.divide(this.subtract(this.cos(x0, true), x), this.sin(x0, true)));

      if (this.isPrecise(xn, x0, this.PRECISION)) break;

      x0 = xn;

    }

    xn = this.fix(xn);

    if (!this.RADIANS) return prefix + this.degrees(xn);
    return prefix + xn;

  }

  sinh(x) {
    return this.divide(this.subtract(this.exp(x), this.exp("-"+x)), "2");
  }
  cosh(x) {
    return this.divide(this.add(this.exp(x), this.exp("-"+x)), "2");
  }
  tanh(x) {
    return this.divide(this.sinh(x), this.cosh(x));
  }
  asinh(x) {
    return this.ln(this.add(x, this.sqrt(this.add(this.pow(x, "2"), "1"))));
  }
  acosh(x) {
    return this.ln(this.add(x, this.sqrt(this.subtract(this.pow(x, "2"), "1"))));
  }


  arctan(x) {
    let prefix = "";
    if (x[0] == "-") {
      x = x.slice(1);
      prefix = "-";
    }


    let MAX = 10;
    let iterations = 0;
    let x0 = Math.atan(x).toString();
    let xn;

    while (true && iterations < MAX) {
      iterations++;

      let cos = this.cos(x0, true);
      xn = this.add(this.subtract(x0, this.multiply(this.sin(x0, true), cos)), this.multiply(x, this.pow(cos, "2")));

      if (this.isPrecise(xn, x0, this.PRECISION)) break;

      x0 = xn;

    }
    //console.log("Iterations: "+iterations)
    if (!this.RADIANS) return prefix + this.degrees(xn);
    return prefix + xn;

  }

  cos(x, isRadian = this.RADIANS) {
    if (this.isZero(x)) return "1";
    if (!isRadian) {
      x = this.radians(x);
    } else {
      x = this.reduceAngle(x, true);
    }


    let MAX = 10000;
    let iterations = 0;
    let n = 0;
    let term = "1";
    let sum = term;
    let old_sum = "0";
    let neg = "-";

    while (true && iterations < MAX) {
      iterations++;


      term = this.divide(this.multiply(term, this.square(x)), ((n+1)*(n+2)).toString());
      sum = this.add(sum, neg + term);

      n += 2;

      neg == "-" ? neg = "": neg = "-";

      if (this.isPrecise(sum, old_sum, this.PRECISION)) {
        break;
      }

      old_sum = sum;

    }

    return this.fix(sum.slice(0, this.PRECISION + 7));

  }

  tan(x) {
    return this.fix(this.divide(this.sin(x), this.cos(x)));
  }

  reduceAngle(theta, isRadian = this.RADIANS) {

    let f,
    prefix = "";
    if (theta[0] == "-") {
      prefix = "-";
      theta = theta.slice(1);
    }
    if (isRadian) {
      theta = this.multiply(theta, this.parser.CONSTANTS.tauReciprocal);
      f = theta.split(".")[1];

      return prefix + this.multiply("0." + f, this.parser.CONSTANTS.tau);
    } else {
      theta = this.multiply(theta, this.divide("1", "360"));
      f = theta.split(".")[1];
      return prefix + this.multiply("0." + f, "360");
    }

    return theta;

  }

  radians(deg) {
    deg = this.reduceAngle(deg, false);
    return this.multiply(this.parser.CONSTANTS.RADIANS_FACTOR, deg);
  }

  degrees(rad) {
    rad = this.reduceAngle(rad, true);
    return this.multiply(this.parser.CONSTANTS.RADIANS_FACTOR_RECIPROCAL, rad);
  }

  sqrt(x) {
    return this.nthRoot(x, 2);
  }

  atanh(x) {

    if (this.isZero(x)) return "0";
    return this.divide(this.ln(this.divide(this.add("1", x), this.subtract("1", x))), "2");
    /*let term = x;
    let MAX = 10000;
    let sum = term;
    let n = 1;
    let iterations = 0;
    let old_sum = "0";
    while (true && iterations < MAX) {
      iterations++;
      n += 2;
      term = this.multiply(term, this.pow(x, "2"));
      sum = this.add(sum, this.divide(term, n.toString()));
      if(this.isPrecise(sum, old_sum, this.PRECISION)) break;
      old_sum = sum;
    }
    return sum;*/
  }

  isPrecise(oldNum, newNum, PRECISION) {
    let frac = this.subtract(newNum, oldNum).split(".")[1];
    let match = frac.match(/^0+/);
    let digits;
    match ? digits = match[0].length: digits = 0;
    return digits >= PRECISION;
  }

  square(x) {
    return this.multiply(x, x);
  }

  NormalFromScientific(num) {
    let [n,
      e = 1] = num.split("e");
    if (e == 1) return num;

    e = parseInt(e);

    let [i,
      f = ""] = n.split(".");

    let str = i + f;
    if (e > 0) {
      str = str.padEnd(str.length + e - f.length, "0");
    } else {
      str = "0." + str.padStart(e + 1 + str.length, "0");
    }

    return str;

  }

  static NormalToScientific(num, len = 17) {
    let [i,
      f = ""] = num.split(".");

    let prefix = "";
    if (i[0] == "-") {
      prefix = "-";
      i = i.slice(1);
    }

    if (i != "0") {
      let str = i + f;
      let e = (i.length - 1);
      if (e < 12) return num.slice(0, len + 1 + prefix.length);
      let eStr = e.toString();
      if (eStr.length > 3) len -= eStr.length - 3;
      return prefix + str[0] + "." + str.slice(1, len) + "E" + e;
    } else {
      let match = f.match(/^0+/);
      let leadingZeros = 0;
      if (match) leadingZeros = match[0].length;
      if (leadingZeros < 15) return num.slice(0, len + prefix.length + 1);
      let fWithoutLZeros = BigInt(f).toString();
      let e = -(leadingZeros + 1);
      let eStr = e.toString();
      if (eStr.length > 3) len -= eStr.length - 3;
      return prefix + fWithoutLZeros.slice(0, 1) + "." + fWithoutLZeros.slice(1, len) + "E" + e;
    }

  }

  stripTrailingZeros(str) {
    return str.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
  }

  evaluate(exp) {
    return this.parser.evaluate(exp);
  }

  init() {
    this.parser.init();
  }

  fix(val) {
    let [i,
      f = ""] = val.split(".");
    let prefix = "";
    if (i[0] == "-") {
      prefix = "-";
      i = i.slice(1);
    }
    let sliced = f.slice(0, this.PRECISION);

    if (sliced == Calculator.multiplyChar("0", this.PRECISION)) {
      return prefix + i;
    } else if (sliced == Calculator.multiplyChar("9", this.PRECISION)) {
      return prefix + (BigInt(i) + 1n).toString();
    }

    return val;

  }

  static multiplyChar(char, times) {
    let r = "";
    for (let i = 0; i < times; i++) {
      r += char;
    }
    return r;
  }

}