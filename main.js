// domain.js
export const OperatorRepo = new (class {
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
  chToOperator(c) {
    for (const [_, op] of Object.entries(this.validOperator)) {
      if (op.text === c) {
        return op.operate;
      }
    }
    return null;
  }
  isOperator(ch) {
    return null !== this.chToOperator(ch);
  }
})();

//service
export class PerformCalculationService {
  commands = {
    CLEAR: "AC",
    BACKSPACE: "<-",
    EVAL: "=",
  };

  prevOperand;
  currOperand;
  currOperatorSymbol;
  port;

  constructor(port) {
    this.port = port;
    this.reset();
    this.dump();
  }

  dump() {
    this.port.setCurrOperator(this.currOperatorSymbol);
    this.port.setPrevOperand(this.prevOperand);
    this.port.setCurrOperand(this.currOperand);
  }

  appendToCurrentOperand(ch) {
    if (!/[\d.]/[Symbol.match](ch)) {
      throw `Invalid character to append: ${ch}`;
    }

    switch (ch) {
      case ".": {
        if (!this.currOperand.endsWith(".")) {
          this.currOperand += ".";
        }
        break;
      }
      default: {
        this.currOperand += ch;
        break;
      }
    }
    this.dump();
  }

  onCommand(cmd) {
    switch (cmd) {
      case this.commands.EVAL: {
        this.evaluate();
        break;
      }
      case this.commands.BACKSPACE: {
        this.currOperand = this.currOperand.substring(0, -1);
        break;
      }
      case this.commands.CLEAR: {
        this.reset();
        break;
      }
    }
    this.dump();
  }

  reset(override) {
    this.prevOperand = override?.prevOperand ?? "0";
    this.currOperand = override?.currOperand ?? "";
    this.currOperatorSymbol = override?.currOperatorSymbol ?? "";
  }

  get currOperatorFn() {
    if (OperatorRepo.isOperator(this.currOperatorSymbol)) {
      return OperatorRepo.chToOperator(this.currOperatorSymbol);
    }
    throw `Unknown operator symbol ${this.currOperatorSymbol}`;
  }

  evaluate() {
    function toDecimal(t) {
      const x = parseFloat(t);
      if (isNaN(x)) {
        throw `Invalid operand: "${t}"`;
      }
      return x;
    }

    if (this.currOperatorFn === null) {
      throw "Invalid state: evaluate with current operator function is null";
    }

    const result = this.currOperatorFn(
      toDecimal(this.prevOperand),
      toDecimal(this.currOperand)
    );
    this.reset({ prevOperand: result.toString() });
  }

  setCurrentOperator(op) {
    if (this.currOperand !== "" && this.currOperatorSymbol !== "") {
      this.evaluate();
    }
    if (this.prevOperand === "0" && this.currOperand !== "") {
      this.reset({ prevOperand: this.currOperand });
    }
    this.currOperatorSymbol = op;
    this.dump();
  }
}

//adapters
function StringAdapter(service, text) {
  for (const ch of text) {
    switch (ch) {
      case "$": {
        console.debug("clear command");
        service.onCommand(service.commands.CLEAR);
        break;
      }
      case "=": {
        console.debug("eval command");
        service.onCommand(service.commands.EVAL);
        break;
      }
      default: {
        if (OperatorRepo.isOperator(ch)) {
          console.debug(`set operator ${ch}`);
          service.setCurrentOperator(ch);
        } else {
          console.debug(`append ${ch}`);
          service.appendToCurrentOperand(ch);
        }
        break;
      }
    }
  }
}

export class ConsolePort {
  setPrevOperand(text) {
    console.info(
      `%c${text.padStart(20, " ")}`,
      "background-color:#bbff0060;color: gray;font-size:1.5em;padding:0.5em"
    );
  }

  setCurrOperator(text) {
    function getOperatorRepresentation(t) {
      switch (t) {
        case "a": {
          return "\u002b";
        }
        case "s": {
          return "\u2212";
        }
        case "m": {
          return "\u00d7";
        }
        case "d": {
          return "\u00f7";
        }
        case "": {
          return " ";
        }
        default: {
          return `Not supported operator: ${t}`;
        }
      }
    }
    console.info(
      `%c${getOperatorRepresentation(text)}`,
      "background-color:#00ff0030;color:black;font-size:2em;padding:0.2em;"
    );
  }

  setCurrOperand(text) {
    console.info(
      `%c${text.padStart(20, " ")}`,
      "background-color:#00ff00f0;color: black;font-size:2em;font-weight:bold;font-size:1.5em;padding:0.5em"
    );
  }
}

//tests
export const testcases = [
  /*
    given an incomplete binary expression 
    when user enters clear command 
    then it should reset current binary expression
  */
  "$1234",
  "$1234a",
  /*
    basic calculations
  */
  "$1234a567=",
  "$1234s567=",
  "$1234m567=",
  "$1234d567=",
  /*
    given a valid binary expression
    when user enters an equal sign
    then it should cascade this binary expression
  */
  "$1234a567=d1000=",
  /*
    given a valid binary expression
    when user enters an operator
    then it should cascade this binary expression before adding newly entered operator
  */
  "$1234a567s",
  "$1234d23m23d23m23d23m23=",
  "$1234a567s1000m23m45678910=",
];
for (const testcase of testcases) {
  let service = new PerformCalculationService(new ConsolePort());
  StringAdapter(service, testcase);
}
