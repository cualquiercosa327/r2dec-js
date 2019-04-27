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
	const bigInt = require('libdec2/libs/bigint');
	const Imm = require('libdec2/ir/immediate');
	const JIR = require('libdec2/jir');

	const _math_jir = [{
			op: JIR.Add,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.add(b.arg1.value) : a;
			}
		}, {
			op: JIR.And,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.and(b.arg1.value) : a;
			}
		}, {
			op: JIR.Decrease,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.subtract(b.arg1.value) : a;
			}
		}, {
			op: JIR.Divide,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.divide(b.arg1.value) : a;
			}
		}, {
			op: JIR.Increase,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.add(b.arg1.value) : a;
			}
		}, {
			op: JIR.Module,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.module(b.arg1.value) : a;
			}
		}, {
			op: JIR.Multiply,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.multiply(b.arg1.value) : a;
			}
		}, {
			op: JIR.Negate,
			fcn: function(a, b) {
				return a.negate();
			}
		}, {
			op: JIR.Not,
			fcn: function(a, b) {
				return a.not(b);
			}
		}, {
			op: JIR.Or,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.or(b.arg1.value) : a;
			}
		}
		/*, {
				op: JIR.RotateLeft,
				fcn: function(a, b, r) {
					// target = (arg0 << arg1) | (arg0 >> (arg2 - arg1))
					var bits = b.arg1;
					var hi = a.shiftLeft(b);
				}
			}, {
				op: JIR.RotateRight,
				fcn: function(a, b, r) {
					// target = (arg0 >> arg1) | (arg0 << (arg2 - arg1))
					var hi = a.sum(b);
				}
			}*/
		, {
			op: JIR.ShiftLeft,
			fcn: function(a, b, r) {
				return b.arg1 instanceof Imm || typeof b.arg1 == "number" ? a.shiftLeft(b.arg1).and(bigInt["mask" + r.size]) : a;
			}
		}, {
			op: JIR.ShiftRight,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm || typeof b.arg1 == "number" ? a.shiftRight(b.arg1) : a;
			}
		}, {
			op: JIR.Subtract,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.subtract(b.arg1.value) : a;
			}
		}, {
			op: JIR.Xor,
			fcn: function(a, b) {
				return b.arg1 instanceof Imm ? a.xor(b.arg1.value) : a;
			}
		}
	];

	function _math_solver(op, regs) {
		for (var i = 0; i < _math_jir.length; i++) {
			if (op instanceof _math_jir[i].op && op.target == op.arg0 && regs[op.target.name]) {
				return _math_jir[i].fcn;
			}
		}
		return null;
	}

	function _regName(op, name) {
		return op[name] ? op[name].name : null;
	}

	function _xored_assigned(op) {
		var target =  _regName(op, 'target');
		var arg0 =  _regName(op, 'arg0');
		var arg1 =  _regName(op, 'arg1');
		return op instanceof JIR.Xor && target == arg0 && target == arg1;
	}

	function _solve_math(ir, registers) {
		var i, m, reginfo, key;
		var new_ir = [];
		registers = registers || {};
		for (i = 0; i < ir.length; i++) {
			reginfo = registers[_regName(ir[i], 'target')] ||
				registers[_regName(ir[i], 'arg0')] ||
				registers[_regName(ir[i], 'arg1')] ||
				registers[_regName(ir[i], 'arg2')];
			//console.log(ir[i].toString(), ir[i] instanceof JIR.Call)
			//console.log(ir[i].toString());
			if (ir[i] instanceof JIR.Call || ir[i] instanceof JIR.Return) {
				for (key in registers) {
					reginfo = registers[key];
					if (reginfo.added) {
						continue;
					}
					reginfo.added = true;
					new_ir.push(new JIR.Assign(reginfo.register, new Imm(reginfo.value)));
					//console.log("################################");
					//console.log("	Call/Ret", new_ir[new_ir.length - 1].toString());
					//console.log("################################");
				}
			} else if (_regName(ir[i], 'target') != (registers[_regName(ir[i], 'arg2')] || _regName(ir[i], 'arg1') || _regName(ir[i], 'arg0')) &&
				registers[_regName(ir[i], 'arg1')]) {
				if (!reginfo.added) {
					reginfo.added = true;
					new_ir.push(new JIR.Assign(reginfo.register, new Imm(reginfo.value)));
					//console.log("################################");
					//console.log("	Assign", new_ir[new_ir.length - 1].toString());
					//console.log("################################");
				}
			}
			if (ir[i] instanceof JIR.Assign && ir[i].arg0 instanceof Imm) {
				//console.log("################################");
				//console.log("	Added", ir[i].toString());
				//console.log("################################");
				registers[_regName(ir[i], 'target')] = {
					added: false,
					register: ir[i].target,
					value: bigInt(ir[i].arg0.value)
				};
			} else if (_xored_assigned(ir[i])) {
				console.log("################################");
				console.log("	Added", ir[i].toString());
				console.log("################################");
				registers[_regName(ir[i], 'target')] = {
					added: false,
					register: ir[i].target,
					value: bigInt.zero
				};
			} else {
				reginfo = registers[_regName(ir[i], 'target')];
				if ((m = _math_solver(ir[i], registers)) != null) {
					//console.log("++++++++++++++++++++++++++++++++");
					//console.log("	Math", ir[i].toString());
					//console.log("	   ", reginfo.value, " -> ", m(reginfo.value, ir[i], reginfo.register));
					//console.log("++++++++++++++++++++++++++++++++");
					reginfo.value = m(reginfo.value, ir[i], reginfo.register);
				} else {
					new_ir.push(ir[i]);
				}
			}
		}
		for (key in registers) {
			reginfo = registers[key];
			if (reginfo.added) {
				continue;
			}
			reginfo.added = true;
			new_ir.push(new JIR.Assign(reginfo.register, new Imm(reginfo.value)));
			//console.log("################################");
			//console.log("	Jump", new_ir[new_ir.length - 1].toString());
			//console.log("################################");
		}
		//console.log("--------------------------------");
		//new_ir.forEach(function(op) {
		//	console.log("	" + op);
		//});
		//console.log("--------------------------------");
		return new_ir;
	}

	return {
		solveMath: _solve_math
	};
})();