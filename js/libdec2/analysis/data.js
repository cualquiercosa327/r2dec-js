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
    const Optimize = require('libdec2/ir/optimize');
    //const Logger = require('libdec2/logger');
    const Block = require('libdec2/analysis/block');
    const CtrlFlow = require('libdec2/analysis/controlflow');
    const r2 = require('libdec2/r2');

    function _optimize_ir(block, regs) {
        block.ir = Optimize.solveMath(block.ir, regs);
    }

    function _convert_to_ir(block, arch) {
        if (arch.pre_conversion) {
            block.opcodes = arch.pre_conversion(block.opcodes);
        }
        for (var i = 0; i < block.opcodes.length; i++) {
            var x = arch.parse(block.opcodes[i].asm);
            x = Array.isArray(x) ? x : [x];
            block.setMop(i, x);
            block.addIR(x);
        }
        if (arch.post_conversion) {
            block.opcodes = arch.post_conversion(block.opcodes);
        }
    }

    /**
     * Decompiler Data
     * @param {String} name   Routine name
     * @param {Blocks} blocks Blocks of the routine
     */
    function DecData(name, blocks) {
        this.name = name;
        this.blocks = blocks;
    }

    /**
     * Converts all the blocks data to IR
     */
    DecData.prototype.toIR = function(arch) {
        for (var i = 0; i < this.blocks.length; i++) {
            _convert_to_ir(this.blocks[i], arch);
        }
    };

    /**
     * Optimize all the blocks data containing IR
     */
    DecData.prototype.optimize = function(arch) {
        var regs = {};
        if (arch.optimize_regs) {
            arch.optimize_regs().forEach(function(reg) {
                regs[reg.name] = {
                    register: reg,
                    added: true,
                    value: r2.bigint("dr " + reg.name, bigInt.zero)
                };
                if (regs[reg.name].value.eq(bigInt.zero)) {
                    delete regs[reg.name]
                }
            });
        }
        for (var i = 0; i < this.blocks.length; i++) {
            _optimize_ir(this.blocks[i], regs);
        }
    };

    /**
     * Apply control flow
     */
    DecData.prototype.controlflow = function(arch) {
        CtrlFlow.newFlows(this.blocks);
    };

    /**
     * Dumps all the decompiler data.
     */
    DecData.prototype.dump = function(dumpIR) {
        console.log("[DecData " + this.name);
        for (var i = 0; i < this.blocks.length; i++) {
            console.log("    [Block 0x" + this.blocks[i].location.toString(16) + " " + this.blocks[i].opcodes.length);
            if (dumpIR) {
                this.blocks[i].ir.forEach(function(x) {
                    console.log("        " + x);
                });
            } else {
                this.blocks[i].opcodes.forEach(function(x) {
                    console.log("        " + x);
                });
            }
            console.log("    ]");
        }
        console.log("]");
    };

    function _map_opcodes(asm) {
        return asm.opcode;
    }

    function _map_blocks(block) {
        var b = new Block(block.offset, block.ops.map(_map_opcodes));
        if (block.jump) {
            b.setJump(block.jump);
        }
        if (block.fail) {
            b.setFail(block.fail);
        }
        return b;
    }

    function _map_locations(block) {
        return block.offset.toString(16);
    }

    function _fb(address, locations) {
        return locations.indexOf(address.toString(16));
    }

    function _create_dec_data() {
        var graph = r2.json('agj', [])[0];
        if (graph) {
            var blocks = graph.blocks.map(_map_blocks);
            var locations = graph.blocks.map(_map_locations);
            blocks.forEach(function(b, _, bs) {
                var idx;
                if (b.jump && (idx = _fb(b.jump, locations)) >= 0) {
                    b.setJump(bs[idx]);
                }
                if (b.fail && (idx = _fb(b.fail, locations)) >= 0) {
                    b.setFail(bs[idx]);
                }
            });
            return new DecData(graph.name, blocks);
        }
        return null;
    }

    DecData.create = _create_dec_data;

    return DecData;
})();