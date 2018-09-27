/* 
 * Copyright (C) 2018 elicn
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
    var Expr = require('libdec/core/ir/expressions');

    var _correct_arith = function(expr) {
        if (expr instanceof Expr.assign) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            var one = new Expr.val(1, lhand.size);

            // x = x + 1
            if ((rhand instanceof Expr.add) && (rhand.operands[0].equals(lhand)) && (rhand.operands[1].equals(one))) {
                return new Expr.inc(lhand);
            }

            // x = x - 1
            if ((rhand instanceof Expr.sub) && (rhand.operands[0].equals(lhand)) && (rhand.operands[1].equals(one))) {
                return new Expr.dec(lhand);
            }
        }

        // x + 0
        // x - 0
        if ((expr instanceof Expr.add) || (expr instanceof Expr.sub)) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            if ((rhand instanceof Expr.val) && rhand.value == 0) {
                return lhand;
            }
        }

        return null;
    };

    var _correct_sign = function(expr) {
        // x + -y
        if ((expr instanceof Expr.add) && (expr.operands[1] instanceof Expr.val) && (expr.operands[1].value < 0)) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            rhand.value = Math.abs(rhand.value);

            return new Expr.sub(lhand, rhand);
        }

        // x - -y
        if ((expr instanceof Expr.sub) && (expr.operands[1] instanceof Expr.val) && (expr.operands[1].value < 0)) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            rhand.value = Math.abs(rhand.value);

            return new Expr.add(lhand, rhand);
        }

        return null;
    };

    var _correct_ref = function(expr) {
        // &*x
        if ((expr instanceof Expr.address_of) && (expr.operands[0] instanceof Expr.deref)) {
            return expr.operands[0].operands[0];
        }

        // *&x
        if ((expr instanceof Expr.deref) && (expr.operands[0] instanceof Expr.address_of)) {
            return expr.operands[0].operands[0];
        }

        return null;
    };

    var _correct_bitwise = function(expr) {
        // x ^ 0
        // x ^ x
        if (expr instanceof Expr.xor) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            var zero = new Expr.val(0, lhand.size);
            
            if (rhand.equals(zero)) {
                return lhand;
            }

            if (rhand.equals(lhand)) {
                return zero;
            }
        }

        // x & 0
        // x & x
        if (expr instanceof Expr.and) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];
            
            var zero = new Expr.val(0, lhand.size);

            if (rhand.equals(zero)) {
                return zero;
            }

            if (rhand.equals(lhand)) {
                return lhand;
            }
        }

        // ((x >> c) << c) yields (x & ~((1 << c) - 1))
        if (expr instanceof Expr.shl) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            if ((lhand instanceof Expr.shr) && (rhand instanceof Expr.val)) {
                var inner_lhand = lhand.operands[0];
                var inner_rhand = lhand.operands[1];
    
                if (inner_rhand instanceof Expr.val && inner_rhand.equals(rhand)) {
                    var mask = new Expr.val(~((1 << rhand.value) - 1), rhand.size);

                    return new Expr.and(inner_lhand, mask);
                }
            }
        }

        return null;
    };

    var _equality = function(expr) {
        if (expr instanceof Expr.cmp_eq) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            if (rhand instanceof Expr.val) {
                // ((x + c1) == c2) yields (x == c3) where c3 = c2 - c1
                if ((lhand instanceof Expr.add) && (lhand.operands[1] instanceof Expr.val)) {
                    var new_lhand = lhand.operands[0];
                    var new_rhand = new Expr.val(rhand.value - lhand.operands[1].value);

                    return new Expr.cmp_eq(new_lhand, new_rhand);
                }

                // ((x - c1) == c2) yields (x == c3) where c3 = c2 + c1
                if ((lhand instanceof Expr.sub) && (lhand.operands[1] instanceof Expr.val)) {
                    var new_lhand = lhand.operands[0];
                    var new_rhand = new Expr.val(rhand.value + lhand.operands[1].value);

                    return new Expr.cmp_eq(new_lhand, new_rhand);
                }
            }
        }

        return null;
    };

    // TODO: 'or' conditions and 'eq', 'ne' comparisons are commotative
    var _converged_cond = function(expr) {
        if (expr instanceof Expr.bool_or) {
            var lhand = expr.operands[0];
            var rhand = expr.operands[1];

            // ((x > y) || (x == y)) yields (x >= y)
            if ((lhand instanceof Expr.cmp_gt) &&
                (rhand instanceof Expr.cmp_eq) &&
                (lhand.operands[0].equals(rhand.operands[0])) &&
                (lhand.operands[1].equals(rhand.operands[1]))) {
                    return new Expr.cmp_ge(lhand.operands[0], lhand.operands[1]);
            }

            // ((x < y) || (x == y)) yields (x <= y)
            if ((lhand instanceof Expr.cmp_lt) &&
                (rhand instanceof Expr.cmp_eq) &&
                (lhand.operands[0].equals(rhand.operands[0])) &&
                (lhand.operands[1].equals(rhand.operands[1]))) {
                    return new Expr.cmp_le(lhand.operands[0], lhand.operands[1]);
            }

            // ((x < y) || (x > y))  yields (x != y)
            if ((lhand instanceof Expr.cmp_lt) &&
                (rhand instanceof Expr.cmp_gt) &&
                (lhand.operands[0].equals(rhand.operands[0])) &&
                (lhand.operands[1].equals(rhand.operands[1]))) {
                    return new Expr.cmp_ne(lhand.operands[0], lhand.operands[1]);
            }
        }

        // (!(x > y))  yields (x <= y)
        // (!(x < y))  yields (x >= y)
        // (!(x == y)) yields (x != y)
        // (!(x != y)) yields (x == y)
        if (expr instanceof Expr.bool_not) {
            /*
            var inv = {
                Expr.cmp_eq : Expr.cmp_ne,
                Expr.cmp_ne : Expr.cmp_eq,
                Expr.cmp_gt : Expr.cmp_le,
                Expr.cmp_ge : Expr.cmp_lt,
                Expr.cmp_lt : Expr.cmp_ge,
                Expr.cmp_le : Expr.cmp_gt
            };
            */

        }

        return null;
    };

    // --------------------

    var _rules = [
        _correct_arith,
        _correct_sign,
        _correct_ref,
        _correct_bitwise,
        _equality,
        _converged_cond
    ];

    return {
        // [!] note that simplifications are done in-place
        run: function(stmt) {
            var modified;

            do {
                modified = false;

                stmt.expressions.forEach(function(e) {
                    e.iter_operands().forEach(function(o) {
                        _rules.forEach(function(r) {
                            var new_expr = r(o);

                            if (new_expr) {
                                o.replace(new_expr);
                            }
                        });
                    });
                });
            } while (modified);
        }
    };
})();