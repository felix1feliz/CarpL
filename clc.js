const process = require("node:process");

class CommandLine {
	constructor() {
		this._argv = process.argv;
		this._argc = this._argv.length;
	}

	getArgv() {
		return this._argv;
	}

	getArgc() {
		return this._argc;
	}

	getArgvWithoutExecutable() {
		return this.getArgv().slice(2, this._argc);
	}

	getArgcWithoutExecutable() {
		return this.getArgc() - 2;
	}
}

class OptionsHandler {
	constructor() {
		this._help = false;
		this._source_file = null;
		this._output_file = null;
		this._err = null;
	}

	setOptions(args) {
		let argv = args.getArgvWithoutExecutable();
		let argc = args.getArgcWithoutExecutable();

		for(let i = 0; i < argc; i++) {
			let file_extension;
			switch(argv[i]) {
				case "-h":
				case "--help":
					if(argc !== 1) {
						this._err = "Arguments incompatible with flag '-h'";
						return;
					}
					this._help = true;
					break;
				case "-o":
				case "--output":
					i++;
					if(this.getOutputFile() !== null) {
						this._err = "Can only specify output file once";
						return;
					}
					if(i >= argc) {
						this._err = "Output flag requires an argument";
						return;
					}
					file_extension = argv[i].split(".").pop();
					if(file_extension !== "asm") {
						this._err = `Output file '${argv[i]}' must have file extension '.asm'`;
						return;
					}
					this._output_file = argv[i];
					break;
				default:
					if(this.getSourceFile() !== null) {
						this._err = `Unwanted argument '${argv[i]}'`;
						return;
					}
					file_extension = argv[i].split(".").pop();
					if(file_extension !== "cl") {
						this._err = `Source code '${argv[i]}' must have file extension '.cl'`;
						return;
					}
					this._source_file = argv[i];

					break;
			}
		}

		if(this.getHelp()) return;

		if(this.getSourceFile() === null) {
			this._err = "Source file was not specified";
			return;
		}

		if(this.getOutputFile() === null) {
			let extensionless_source_file = this._source_file.split(".");
			extensionless_source_file.pop();
			extensionless_source_file = extensionless_source_file.join(".");
			this._output_file = extensionless_source_file.concat(".asm");
		}
	}

	shouldCompile() {
		if(this._err !== null) return false;
		if(this._help) return false;
		return true;
	}

	// GETTERS
	
	getHelp() {
		return this._help;
	}

	getSourceFile() {
		return this._source_file;
	}

	getOutputFile() {
		return this._output_file;
	}

	getErr() {
		return this._err;
	}
}

class OutputHandler {
	static printHelp() {
		console.log("Usage:");
		console.log(" node clc.js <source>");
		console.log("Flags:");
		console.log(" (--help | -h)");
		console.log("    Print usage help");
		console.log(" (--output | -o) <output file>");
		console.log("    Specify output file");
	}
}

class Tests {
	static runTests() {
		let start_of_testing = performance.now();
		let num_of_failed_tests = 0;
		console.log("+\n+ START OF TESTS\n+\n");

		console.log("[COMMAND LINE TESTS]");
		this.runCommandLineTests().forEach((e, i) => {
			console.log(`TEST ${i+1}: ${e}`);
			if(e == "Failed!") num_of_failed_tests++;
		});
		console.log(""); // Break line

		console.log("[OPTIONS HANDLER TESTS]");
		this.runOptionsHandlerTests().forEach((e, i) => {
			e.errors.forEach(err => {
				console.log(err);
			});
			console.log(`TEST ${i+1}: ${e.ret}`);
			if(e.ret === "Failed!") num_of_failed_tests++;
		});
		console.log(""); // Break line

		console.log(`Time elapsed: ${Math.trunc(performance.now() - start_of_testing)}ms`);
		console.log(`Test(s) failed: ${num_of_failed_tests}`);
		console.log(""); // Break line

		console.log("-\n- END OF TESTS\n-");
		return num_of_failed_tests;
	}

	static runCommandLineTests() {
		let results = [];

		const COMMAND_LINE = new CommandLine();

		// TEST 1
		// Tests if argv is in agreement with getArgv
		if(COMMAND_LINE._argv !== COMMAND_LINE.getArgv()) {
			results.push("Failed!");
		} else {
			results.push("Succeeded!");
		}

		// TEST 2
		// Tests if args were properly collected
		if(COMMAND_LINE.getArgv() !== process.argv) {
			results.push("Failed!");
		} else {
			results.push("Succeeded!");
		}

		// TEST 3
		// Tests if argc is in agreement with getArgc
		if(COMMAND_LINE._argc !== COMMAND_LINE.getArgc()) {
			results.push("Failed!");
		} else {
			results.push("Succeeded!");
		}

		// TEST 4
		// Tests if args length was properly collected
		if(COMMAND_LINE.getArgc() !== process.argv.length) {
			results.push("Failed!");
		} else {
			results.push("Succeeded!");
		}

		// TEST 5
		// Tests if argv executable is being properly removed
		COMMAND_LINE._argv = ["node", "executable"];
		COMMAND_LINE._argc = 2;
		
		if(COMMAND_LINE.getArgvWithoutExecutable().length !== 0) {
			results.push("Failed!");
		} else {
			results.push("Succeeded!");
		}

		// TEST 6
		// Tests if argc without executable is being properly checked
		if(COMMAND_LINE.getArgvWithoutExecutable().length !== COMMAND_LINE.getArgcWithoutExecutable()) {
			results.push("Failed!");
		} else {
			results.push("Succeeded!");
		}

		return results;
	}

	static runOptionsHandlerTests() {
		let results = []

		const TESTS = require("./tests/optionsHandlerTests.json").content;

		TESTS.forEach(e => {
			let errors = [];
			const OPTIONS = new OptionsHandler();
			e.data.getArgv = () => {
				return e.data.argv;
			};
			e.data.getArgc = () => {
				return e.data.argc;
			};
			e.data.getArgvWithoutExecutable = () => {
				return e.data.getArgv().slice(2, this._argc);
			};
			e.data.getArgcWithoutExecutable = () => {
				return e.data.getArgc() - 2;
			}
			OPTIONS.setOptions(e.data);

			if(OPTIONS._help !== OPTIONS.getHelp()) {
				errors.push("ERROR: '_help' doesn't equal 'getHelp()'");
			}
			if(OPTIONS._source_file !== OPTIONS.getSourceFile()) {
				errors.push("ERROR: '_source_file' doesn't equal 'getSourceFile()'");
			}
			if(OPTIONS._output_file !== OPTIONS.getOutputFile()) {
				errors.push("ERROR: '_output_file' doesn't equal 'getOutputFile()'");
			}
			if(OPTIONS._err !== OPTIONS.getErr()) {
				errors.push("ERROR: '_err' doesn't equal 'getErr()'");
			}

			if(e.result.help !== OPTIONS.getHelp()) {
				errors.push(`ERROR: expected help '${e.result.help}', but got '${OPTIONS.help}'`);
			}
			if(e.result.source_file !== OPTIONS.getSourceFile()) {
				errors.push(`ERROR: expected source file '${e.result.source_file}', but got '${OPTIONS.getSourceFile()}'`);
			}
			if(e.result.output_file !== OPTIONS.getOutputFile()) {
				errors.push(`ERROR: expected output file '${e.result.output_file}', but got '${OPTIONS.getOutputFile()}'`);
			}
			if(e.result.err !== OPTIONS.getErr()) {
				errors.push(`ERROR: expected error '${e.result.err}', but got '${OPTIONS.getErr()}'`);
			}
			if(e.result.shouldCompile !== OPTIONS.shouldCompile()) {
				errors.push(`ERROR: expected should compile '${e.result.shouldCompile}', but got '${OPTIONS.shouldCompile()}'`);
			}

			if(errors.length !== 0) {
				results.push({ret: "Failed!", errors: errors});
			} else {
				results.push({ret: "Succeeded!", errors: errors});
			}
		});
		return results;
	}
}

class Main {
	static main() {
		const COMMAND_LINE = new CommandLine();
		const OPTIONS = new OptionsHandler();
		OPTIONS.setOptions(COMMAND_LINE);
		const OPTION_ERROR = OPTIONS.getErr();
		if(OPTION_ERROR !== null) {
			console.log(OPTION_ERROR);
			return;
		}

		if(OPTIONS.getHelp()) {
			OutputHandler.printHelp();
		}

		if(!OPTIONS.shouldCompile()) {
			return;
		}
	}
}

// NOTE: COMMENT THIS IN RELEASE

const NUM_OF_FAILED_TESTS = Tests.runTests();
if(NUM_OF_FAILED_TESTS === 0) Main.main();

// NOTE: UNCOMMENT THIS IN RELEASE

// Main.main();
