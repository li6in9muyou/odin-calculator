// domain.js
//service
class EnterBinaryOperatorService {
  validOperator = {
    subtract: {
      text: "s",
      operate: (left, right) => left - right,
    },
    add: {
      text: "a",
      operate: (left, right) => left + right,
    },
    divide: {
      text: "d",
      operate: (left, right) => left / right,
    },
    multiply: {
      text: "m",
      operate: (left, right) => left * right,
    },
  };

  text = "";

  addCharacter(ch) {
    if (!ch.match(/[a-zA-Z]+/)) {
      throw "Accepts only letters";
    }
    this.text += ch;
  }

  popCharacter() {
    this.text = this.text.substring(0, this.text.length - 1);
  }

  chToOperator(c) {
    for (const [_, op] of Object.entries(this.validOperator)) {
      if (op.text === c) {
        return op.operate;
      }
    }
    return null;
  }

  checkValidText() {
    return null !== this.chToOperator(this.text);
  }

  operate(lhs, rhs) {
    if (!this.checkValidText()) {
      throw `Unknown binary operator: ${this.text}`;
    }
    return this.chToOperator(this.text)(lhs, rhs);
  }
}

class EnterDecimalService {
  text = "";

  addCharacter(ch) {
    if (!ch.match(/[\d.-]/)) {
      throw "Accepts only digits and dot sign, minus sign";
    }
    if (ch === "-" && this.text !== "") {
      throw "Accepts minus sign only as first character";
    }
    if (ch === "." && this.text.indexOf(".") !== -1) {
      throw "Accepts only one dot sign";
    }
    this.text += ch;
  }

  popCharacter() {
    this.text = this.text.substring(0, this.text.length - 1);
  }

  checkValidText() {
    return !isNaN(Number(this.text));
  }

  evaluate() {
    if (this.checkValidText()) {
      return Number(this.text);
    }
    throw `Bad text for a Decimal ${this.text}`;
  }
}

class EnterBinaryExpressionService {
  tokens = [];
  op;
  lhs;
  rhs;
  curr;

  constructor() {
    this.op = new EnterBinaryOperatorService();
    this.lhs = new EnterDecimalService();
    this.rhs = new EnterDecimalService();
    this.tokens = [this.lhs, this.op, this.rhs];
    this.curr = 0;
  }

  addCharacter(ch) {
    const currToken = this.tokens[this.curr];
    try {
      currToken.addCharacter(ch);
    } catch (e) {
      if (currToken.checkValidText()) {
        ++this.curr;
        this.addCharacter(ch);
      } else {
        console.error("enters", ch, "into", currToken);
        throw "Bad";
      }
    }
  }

  get text() {
    return this.lhs.text + this.op.text + this.rhs.text;
  }

  checkValidText() {
    return (
      this.lhs.checkValidText() &&
      this.rhs.checkValidText() &&
      this.op.checkValidText()
    );
  }

  evaluate() {
    if (this.checkValidText()) {
      return this.op.operate(this.lhs.evaluate(), this.rhs.evaluate());
    }
    throw `Incomplete binary expression: "${this.text}"`;
  }
}

export class PerformCalculationService {
  expression;
  output_port;

  constructor(output_port) {
    this.output_port = output_port;
    this.expression = new EnterBinaryExpressionService();
  }

  addCharacter(ch) {
    switch (ch) {
      case "=": {
        this.output_port.render(this.expression);
        const result = this.expression.evaluate();
        this.expression = new EnterBinaryExpressionService();
        for (const ch of result.toFixed(6).toString()) {
          this.expression.addCharacter(ch);
        }
        break;
      }
      case "$": {
        this.output_port.render(this.expression);
        this.expression = new EnterBinaryExpressionService();
        break;
      }
      default: {
        return this.expression.addCharacter(ch);
      }
    }
  }

  evaluate() {
    try {
      return this.expression.evaluate();
    } catch (e) {
      return Number.NaN;
    }
  }
}

//adapters
function StringAdapter(service, text) {
  for (const ch of text) {
    service.addCharacter(ch);
  }
}

export class ConsolePort {
  render(expr) {
    if (expr.checkValidText()) {
      let rounded = expr.evaluate().toFixed(6);
      if (rounded.endsWith("000000")) {
        rounded = rounded.substring(0, rounded.length - 7);
      }
      console.log("valid expression: ", expr.text, "=", rounded);
    } else {
      console.log("invalid expression: ", expr.text);
    }
  }
}

//tests
export const testcases = [
  "$1234",
  "$1234a",
  "$1234a567=",
  "$1234s567=",
  "$1234m567=",
  "$1234d567=",
  "$1234a567=d1000=",
];
for (const testcase of testcases) {
  let service = new PerformCalculationService(new ConsolePort());
  StringAdapter(service, testcase);
}
