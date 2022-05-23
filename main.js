// domain.js
const Operator = {
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
  addCharacter(ch) {
    function chToOperator(c) {
      for (const op in Operator) {
        if (Operator[op].text === c) {
          return Operator[op];
        }
      }
    }

    switch (ch) {
      case Operator.add.text:
      case Operator.divide.text:
      case Operator.multiply.text:
      case Operator.subtract.text: {
        return chToOperator(ch);
      }
      default:
        throw `Invalid operator: ${ch}`;
    }
  },
};

class Decimal {
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

class BinaryExpression {
  operator;
  leftExpression;
  rightExpression;

  get text() {
    return (
      this.leftExpression.text + this.operator.text + this.rightExpression.text
    );
  }

  setOperator(ch) {
    this.operator = ch;
  }

  setLeftExpression(expr) {
    this.leftExpression = expr;
  }

  setRightExpression(expr) {
    this.rightExpression = expr;
  }

  evaluate() {
    return this.operator.operate(
      this.leftExpression.evaluate(),
      this.rightExpression.evaluate()
    );
  }
}

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
    for (const [_, op] in Object.entries(this.validOperator)) {
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
  current;

  constructor() {
    this.current = new Decimal();
  }

  addCharacter(ch) {
    try {
      this.current.addCharacter(ch);
    } catch (e) {
      console.error(e);
      ConsolePort(this.current);
    }
  }
}

class EnterBinaryExpressionService {
  current;
  left_op;
  op;
  right_op;
  left_done = false;
  op_done = false;
  right_done = false;

  constructor() {
    this.current = new BinaryExpression();
    this.left_op = new Decimal();
    this.right_op = new Decimal();
  }

  addCharacter(ch) {
    if (!this.left_done) {
      try {
        return !this.left_done && this.left_op.addCharacter(ch);
      } catch (e) {
        this.current.setLeftExpression(this.left_op);
        this.left_done = true;
      }
    }

    if (!this.op_done) {
      this.op = Operator.addCharacter(ch);
      this.current.setOperator(this.op);
      this.op_done = true;
      return;
    }

    if (!this.right_done) {
      try {
        return !this.right_done && this.right_op.addCharacter(ch);
      } catch (e) {
        this.current.setRightExpression(this.right_op);
        this.right_done = true;
      }
    }
  }

  evaluate() {
    return this.current.evaluate();
  }
}

//adapters
function StringAdapter(service, text) {
  for (const ch of text) {
    service.addCharacter(ch);
  }
}

function ConsolePort(expr) {
  if (expr instanceof Decimal) {
    console.log(expr.text);
  } else if (expr instanceof BinaryExpression) {
    console.log(expr.text);
  } else {
    console.error(`Unknown Expression: ${JSON.stringify(expr)}`);
  }
}

//tests
const testcases = ["1234a567$", "1234s567$", "1234m567$", "1234d567$"];
for (const testcase of testcases) {
  let service = new EnterBinaryExpressionService();
  StringAdapter(service, testcase);
  ConsolePort(service.current);
  console.log("result:", service.evaluate());
}
