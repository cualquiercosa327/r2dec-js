/* 
 * Copyright (C) 2019 deroad
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = (function() {
	const Throw = require('libdec2/throw');
	const Reg = require('libdec2/ir/register');
	const Tmp = require('libdec2/ir/tempreg');
	const Imm = require('libdec2/ir/immediate');
	const Cnd = require('libdec2/ir/condtype');

	function _2a(x) {
		var a = [];
		for (var i = 0; i < x.length; i++) {
			a[i] = x[i];
		}
		return a;
	}

	function Opcode(obj) {
		Throw.isNotType(obj, "function", Opcode);
		this.__opcode__ = obj.name;
		this._toString = function() {
			return "[" + [this.__opcode__].concat(_2a(arguments)).join(' ') + "]";
		};
	}

	/**
	 * Returns true if the given object is Opcode type
	 * @param  {Object}  obj Any object
	 * @return {Boolean}
	 */
	Opcode.is = function(obj) {
		return !!(obj && obj.__opcode__);
	};

	Opcode.prototype.toString = function() {
		return this._toString();
	};

	/**
	 * Unary expression base class.
	 * @param {Function} fcn    Function object
	 * @param {Reg|Imm}  target Target Reg|Imm
	 * @param {Reg|Imm}  arg0   Argument 0 Reg|Imm
	 */
	function UExpr(fcn, target) {
		Throw.isNotObject(target, [Reg, Imm, Tmp], fcn);
		Opcode.call(this, fcn);
		this.target = target;
		this.toString = function() {
			return this._toString(this.target);
		};
	}

	/**
	 * Binary expression base class.
	 * @param {Function} fcn    Function object
	 * @param {Reg|Imm}  target Target Reg|Imm
	 * @param {Reg|Imm}  arg0   Argument 0 Reg|Imm
	 */
	function BExpr(fcn, target, arg0) {
		Throw.isNotObject(target, [Reg, Imm, Tmp], fcn);
		Throw.isNotObject(arg0, [Reg, Imm, Tmp], fcn);
		Opcode.call(this, fcn);
		this.target = target;
		this.arg0 = arg0;
		this.toString = function() {
			return this._toString(this.target, this.arg0);
		};
	}

	/**
	 * Ternary expression base class.
	 * @param {Function} fcn    Function object
	 * @param {Reg|Imm}  target Target Reg|Imm
	 * @param {Reg|Imm}  arg0   Argument 0 Reg|Imm
	 * @param {Reg|Imm}  arg1   Argument 1 Reg|Imm
	 */
	function TExpr(fcn, target, arg0, arg1) {
		Throw.isNotObject(target, [Reg, Imm, Tmp], fcn);
		Throw.isNotObject(arg0, [Reg, Imm, Tmp], fcn);
		Throw.isNotObject(arg1, [Reg, Imm, Tmp], fcn);
		Opcode.call(this, fcn);
		this.target = target;
		this.arg0 = arg0;
		this.arg1 = arg1;
		this.toString = function() {
			return this._toString(this.target, this.arg0, this.arg1);
		};
	}

	/**
	 * Ternary expression base class with Numeric.
	 * @param {Function} fcn    Function object
	 * @param {Reg|Imm}  target Target Reg|Imm
	 * @param {Reg|Imm}  arg0   Argument 0 Reg|Imm
	 * @param {Number}   arg1   Argument 1 Number
	 */
	function TNExpr(fcn, target, arg0, arg1) {
		Throw.isNotObject(target, [Reg, Imm, Tmp], fcn);
		Throw.isNotObject(arg0, [Reg, Imm, Tmp], fcn);
		Throw.isNotType(arg1, "number", fcn);
		Opcode.call(this, fcn);
		this.target = target;
		this.arg0 = arg0;
		this.arg1 = arg1;
		this.toString = function() {
			return this._toString(this.target, this.arg0, this.arg1);
		};
	}

	/**
	 * Quaternary expression base class with Numeric.
	 * @param {Function} fcn    Function object
	 * @param {Reg|Imm}  target Target Reg|Imm
	 * @param {Reg|Imm}  arg0   Argument 0 Reg|Imm
	 * @param {Reg|Imm}  arg1   Argument 1 Reg|Imm
	 * @param {Number}   arg2   Argument 2 Number
	 */
	function QExpr(fcn, target, arg0, arg1, arg2) {
		Throw.isNotObject(target, [Reg, Imm, Tmp], fcn);
		Throw.isNotObject(arg0, [Reg, Imm, Tmp], fcn);
		Throw.isNotObject(arg1, [Reg, Imm, Tmp], fcn);
		Throw.isNotType(arg2, "number", fcn);
		Opcode.call(this, fcn);
		this.target = target;
		this.arg0 = arg0;
		this.arg1 = arg1;
		this.arg2 = arg2;
		this.toString = function() {
			return this._toString(this.target, this.arg0, this.arg1, this.arg2);
		};
	}

	/*****************************************
	 * Math
	 *****************************************/

	/* target = target + arg1 */
	function Increase() {
		TExpr.call(this, Increase, arguments[0], arguments[0], arguments[1]);
	}

	/* target = target - arg1 */
	function Decrease() {
		TExpr.call(this, Decrease, arguments[0], arguments[0], arguments[1]);
	}

	/* target = arg0 + arg1 */
	function Add() {
		TExpr.call(this, Add, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 - arg1 */
	function Subtract() {
		TExpr.call(this, Subtract, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 * arg1 */
	function Multiply() {
		TExpr.call(this, Multiply, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 / arg1 */
	function Divide() {
		TExpr.call(this, Divide, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 % arg1 */
	function Module() {
		TExpr.call(this, Module, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 & arg1 */
	function And() {
		TExpr.call(this, And, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 | arg1 */
	function Or() {
		TExpr.call(this, Or, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 ^ arg1 */
	function Xor() {
		TExpr.call(this, Xor, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 */
	function Assign(target, arg0) {
		Throw.isNotObject(target, [Reg, Imm, Tmp], Assign);
		Throw.isNotObject(arg0, [Reg, Imm, Tmp], Assign);
		Opcode.call(this, Assign);
		this.target = target;
		this.arg0 = arg0;
		this.toString = function() {
			return this._toString(this.target, this.arg0);
		};
	}

	/* target = arg0 << arg1 */
	function ShiftLeft() {
		TNExpr.call(this, ShiftLeft, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 >> arg1 */
	function ShiftRight() {
		TNExpr.call(this, ShiftRight, arguments[0], arguments[1], arguments[2]);
	}

	/* target = (arg0 << arg1) | (arg0 >> (arg2 - arg1)) */
	function RotateLeft(target, arg0, arg1, arg2) {
		QExpr.call(this, RotateLeft, arguments[0], arguments[1], arguments[2], arguments[4]);
	}

	/* target = (arg0 >> arg1) | (arg0 << (arg2 - arg1)) */
	function RotateRight(target, arg0, arg1, arg2) {
		QExpr.call(this, RotateRight, arguments[0], arguments[1], arguments[2], arguments[4]);
	}

	function Negate() {
		BExpr.call(this, Negate, arguments[0], arguments[1]);
	}

	function Not(target, arg0) {
		BExpr.call(this, Not, arguments[0], arguments[1]);
	}

	function Swap(target, arg0) {
		BExpr.call(this, Swap, arguments[0], arguments[1]);
	}

	/*****************************************
	 * Memory
	 *****************************************/

	/* target = read(arg0, arg1); // arg1 is n of bits to read */
	function Read() {
		TNExpr.call(this, Read, arguments[0], arguments[1], arguments[2]);
	}

	/* write(target, arg0, arg1); // arg1 is n of bits to write */
	function Write() {
		TNExpr.call(this, Write, arguments[0], arguments[1], arguments[2]);
	}

	/*****************************************
	 * Stack (Memory)
	 *****************************************/

	function StackPush() {
		UExpr.call(this, StackPush, arguments[0]);
	}

	function StackPop() {
		UExpr.call(this, StackPop, arguments[0]);
	}

	/*****************************************
	 * Signess
	 *****************************************/

	// from unsigned to signed
	function ExtendSign(location, operands) {
		UExpr.call(this, ExtendSign, arguments[0]);
	}

	// from signed to unsigned
	function ExtendZero(location, operands) {
		UExpr.call(this, ExtendZero, arguments[0]);
	}

	/*****************************************
	 * Compare/Test
	 *****************************************/

	/* target = arg0 & arg1 */
	function Test() {
		TExpr.call(this, Test, arguments[0], arguments[1], arguments[2]);
	}

	/* target = arg0 - arg1 */
	function Compare() {
		TExpr.call(this, Compare, arguments[0], arguments[1], arguments[2]);
	}

	/*****************************************
	 * Jump condition
	 *****************************************/

	function Condition(target, arg0) {
		Throw.isNotObject(target, [Reg, Imm, Tmp], Condition);
		Throw.isNotObject(arg0, [Cnd], Condition);
		Opcode.call(this, Condition);
		this.target = target;
		this.arg0 = arg0;
		this.toString = function() {
			return this._toString(this.target, this.arg0);
		};
	}

	/*****************************************
	 * Other
	 *****************************************/

	function Call() {
		UExpr.call(this, Call, arguments[0]);
	}

	function Return(target) {
		Opcode.call(this, Return);
		this.target = target;
		this.toString = function() {
			return this._toString(this.target);
		};
	}

	function Illegal(target) {
		Throw.isNull(target, Illegal);
		Opcode.call(this, Illegal);
		this.target = target;
		this.toString = function() {
			return this._toString(this.target);
		};
	}

	return {
		/* math operations */
		Add: Add,
		And: And,
		Assign: Assign,
		Decrease: Decrease,
		Divide: Divide,
		Increase: Increase,
		Module: Module,
		Multiply: Multiply,
		Negate: Negate,
		Not: Not,
		Or: Or,
		RotateLeft: RotateLeft,
		RotateRight: RotateRight,
		ShiftLeft: ShiftLeft,
		ShiftRight: ShiftRight,
		Subtract: Subtract,
		Swap: Swap,
		Xor: Xor,
		/* memory */
		Read: Read,
		Write: Write,
		/* stack */
		StackPop: StackPop,
		StackPush: StackPush,
		/* signess */
		ExtendSign: ExtendSign,
		ExtendZero: ExtendZero,
		/* test/compare */
		Test: Test,
		Compare: Compare,
		/* jump condition */
		Condition: Condition,
		/* everything else */
		Illegal: Illegal,
		Call: Call,
		Return: Return,
	};
})();