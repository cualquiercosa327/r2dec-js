/* 
 * Copyright (c) 2017-2019, pancake <pancake@nopcode.org>, Giovanni Dante Grazioli <deroad@libero.it>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * r2dec main function.
 * @param  {Array} args - r2dec arguments to be used to configure the output.
 */
function r2dec_main(args) {
	const Options = require('libdec2/options');
	const Logger = require('libdec2/logger');
	const DecData = require('libdec2/analysis/data');
	const DecArch = require('libdec2/architectures');
	const r2 = require('libdec2/r2');

	try {
		if (!Options.parse(args)) {
			return; // if something was wrong, just stop
		}
		const archname = r2.string("e asm.arch");
		const arch = DecArch[archname];
		if (!arch) {
			Logger.error(archname + ' is not currently supported.\n' +
				'Please open an enhancement issue at https://github.com/wargio/r2dec-js/issues');
			Logger.error('Supported architectures:');
			Logger.error('    ' + Object.keys(DecArch).join(', '));
			return false;
		}

		var data = DecData.create();
		if (data) {
			data.toIR(arch);
			data.dump(true);
			data.optimize(arch);
			data.dump(true);
			data.controlflow(arch);
		} else {
			Logger.error("Error: no data available.\nPlease analyze the function/binary first.");
		}
	} catch (e) {
		Options.exception(e);
	}
}