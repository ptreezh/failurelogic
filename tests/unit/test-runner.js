/**
 * Simple TDD Test Runner for Coffee Shop Game
 * 轻量级测试运行器，支持红-绿-重构循环
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  describe(suiteName, fn) {
    console.log(`\n📦 ${suiteName}`);
    fn();
  }

  test(testName, fn) {
    this.tests.push({ name: testName, fn });
  }

  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    this.afterEachHooks.push(fn);
  }

  async run() {
    for (const test of this.tests) {
      try {
        // Run beforeEach hooks
        for (const hook of this.beforeEachHooks) {
          await hook();
        }

        // Run test
        await test.fn();

        // Run afterEach hooks
        for (const hook of this.afterEachHooks) {
          await hook();
        }

        console.log(`  ✓ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`  ✗ ${test.name}`);
        console.log(`    ${error.message}`);
        if (error.stack) {
          console.log(`    ${error.stack.split('\n').slice(1, 3).join('\n')}`);
        }
        this.failed++;
      }
    }

    this.printSummary();
  }

  printSummary() {
    const total = this.passed + this.failed;
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Tests: ${total}, Passed: ${this.passed}, Failed: ${this.failed}`);
    if (this.failed === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Some tests failed - Red phase 🚦');
    }
    console.log(`${'='.repeat(50)}\n`);
  }
}

class Expect {
  constructor(actual) {
    this.actual = actual;
  }

  get not() {
    return {
      toBe: (expected) => {
        if (this.actual === expected) {
          throw new Error(`Expected ${this.actual} NOT to be ${expected}`);
        }
      },
      toEqual: (expected) => {
        const actualStr = JSON.stringify(this.actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr === expectedStr) {
          throw new Error(`Expected NOT to equal:\n${expectedStr}`);
        }
      },
      toContain: (expected) => {
        if (typeof this.actual === 'string') {
          if (this.actual.includes(expected)) {
            throw new Error(`Expected "${this.actual}" NOT to contain "${expected}"`);
          }
        }
      },
      toBeDefined: () => {
        if (this.actual !== undefined) {
          throw new Error(`Expected value to be undefined`);
        }
      }
    };
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${expected} but got ${this.actual}`);
    }
  }

  toEqual(expected) {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        `Expected:\n${expectedStr}\n\nBut got:\n${actualStr}`
      );
    }
  }

  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error(`Expected value to be defined but got undefined`);
    }
  }

  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected value to be undefined but got ${this.actual}`);
    }

  }

  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`Expected null but got ${this.actual}`);
    }
  }

  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`Expected null but got ${this.actual}`);
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected truthy value but got ${this.actual}`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected falsy value but got ${this.actual}`);
    }
  }

  toBeGreaterThan(expected) {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
  }

  toBeLessThan(expected) {
    if (this.actual >= expected) {
      throw new Error(`Expected ${this.actual} to be less than ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected) {
    if (this.actual < expected) {
      throw new Error(`Expected ${this.actual} to be greater than or equal to ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected) {
    if (this.actual > expected) {
      throw new Error(`Expected ${this.actual} to be less than or equal to ${expected}`);
    }
  }

  toContain(expected) {
    if (typeof this.actual === 'string') {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected "${this.actual}" to contain "${expected}"`);
      }
    } else if (Array.isArray(this.actual)) {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    } else {
      throw new Error('toContain can only be used on strings or arrays');
    }
  }

  toHaveLength(expected) {
    const length = this.actual?.length;
    if (length !== expected) {
      throw new Error(`Expected length ${expected} but got ${length}`);
    }
  }

  toThrow(expectedError) {
    let didThrow = false;
    let actualError = null;

    try {
      this.actual();
    } catch (error) {
      didThrow = true;
      actualError = error;
    }

    if (!didThrow) {
      throw new Error('Expected function to throw an error');
    }

    if (expectedError && !actualError.message.includes(expectedError)) {
      throw new Error(
        `Expected error message to contain "${expectedError}" but got "${actualError.message}"`
      );
    }
  }
}

function expect(actual) {
  return new Expect(actual);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestRunner, expect };
}
