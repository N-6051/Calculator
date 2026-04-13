class ExpressionParser {
  constructor(calc) {
    this.CONSTANTS = {
      pi: Math.PI,
      e: Math.E
    };

    this.calc = calc;

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
        fn: (a) => Math.sin(a)
      },
      "cos": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => Math.cos(a)
      },
      "log": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => Math.log10(a)
      },
      "ln": {
        precedence: 4,
        assoc: "R",
        args: 1,
        fn: (a) => Math.log(a)
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

      
      "neg": {
        precedence: 3,
        assoc: "R",
        args: 1,
        fn: (a) => "-"+a
      }
    };
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
    .replace(/√/g, "sqrt")


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
    this.result = a / b + ".";

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
    this.parser = null;
    this.PRECISION = PRECISION;
    this.parser = new ExpressionParser(this);
    this.CONSTANTS = {
      "pi": new PI(this)
    }

  }

  divide(a, b) {

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
    } = new LazyDivision(p1, p2, 12, this.PRECISION);
    result = prefix + result;
    
    
    return result;

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

  addDecimal(num, dec) {
    if (!dec) return num;
    if (dec < num.length) {
      return num.slice(0, - dec) + "." + num.slice(- dec);
    } else {
      return "0." + num.padStart(dec, "0");
    }
  }

  multiply(a, b) {
    let [i1,
      f1 = "0"] = a.split(".");
    let [i2,
      f2 = "0"] = b.split(".");


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

    return this.add(k1, k2);

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

    let result = "0";
    let pow = 0;

    while (true) {
      let val = this.divide(this.pow(x, pow.toString()), this.factorial(pow))
      
      let match = val.split(".")[1].match(/^0+/);
      let digits;
      match ? digits = match[0].length: digits = 0;
      if (digits >= this.PRECISION) break;

      result = this.add(val, result);
      pow += 1;
    }


    return result;

  }

  pow(a, b) {
    if (b === "0") return "1";
    if (a === "1") return "1";
    if (a === "0") return "0";

    if (!b.split(".")[1]) {
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
  
      return result;
    } else {
      
      return this.exp(this.multiply(b, this.ln(a)));

    }
  }

  ln(x) {
    let x0 = Math.log(parseFloat(x)).toString();

    let xn;
    let i = 0;
    while (true) {
      xn = this.add(this.subtract(x0, "1"), this.divide(x, this.exp(x0)));

      let frac = this.subtract(xn, x0).split(".")[1];
      let match = frac.match(/^0+/);
      let digits;
      match ? digits = match[0].length: digits = 0;
      if (digits >= this.PRECISION) break;

      x0 = xn;

    }

    return xn;

  }

  sqrt(x) {
    return this.pow(x, "0.5");
  }

  evaluate(exp) {
    return this.parser.evaluate(exp);
  }

}
