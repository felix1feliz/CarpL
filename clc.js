const process = require("node:process");
const fs = require("node:fs");

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

class SourceHandler {
	constructor(source_file) {
		this._source_file = source_file;
		this._data = null;
		this._err = null;
	}

	readFile() {
		try {
			this._data = fs.readFileSync(this._source_file, "utf8");
		} catch (e) {
			this._err = e.message;
		}
	}

	getData() {
		return this._data;
	}

	getErr() {
		return this._err;
	}
}

class Token {
	constructor(type, value = null) {
		this._type = type;
		this._value = value;
	}

	getType() {
		return this._type;
	}

	getValue() {
		return this._value;
	}
}

class Tokenizer {
	constructor(code) {
		this._code = code;
		this._tokens = [];
		this._err = null;
	}

	_isAlnum(c) {
		return c.toUpperCase() !== c.toLowerCase() ? true
		: /\d/.test(c) ? true
		: false
	}

	tokenize() {
		for(let i = 0; i < this._code.length; i++) {
			if(this._code.charAt(i) === ' ') {
				continue;
			}

			if(this._code.charAt(i) === '	') {
				continue;
			}

			if(this._code.charAt(i) === '\n') {
				this._tokens.push(new Token("EOL"));
				continue;
			}

			if(this._code.charAt(i) === '0') {
				this._tokens.push(new Token("BOOL", false));
				continue;
			}

			if(this._code.charAt(i) === '1') {
				this._tokens.push(new Token("BOOL", true));
				continue;
			}

			if(this._code.charAt(i) === ';') {
				this._tokens.push(new Token("CS")); // Comment Start
				continue;
			}

			if(this._isAlnum(this._code.charAt(i))) {
				let acc = "";
				while(this._isAlnum(this._code.charAt(i))) {
					acc = acc.concat(this._code.charAt(i));
					i++;
				}
				i--;

				this._tokens.push(new Token("NAME", acc));

				continue;
			}

			this._err = `Unrecognized char '${this._code.charAt(i)}'`;
			break;
		}
	}

	getTokens() {
		return this._tokens;
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

	static printSrcHandlerError(err) {
		if(err.includes("ENOENT: no such file or directory, open ")) {
			console.log("Source file not found");
			return;
		}

		console.log(err);
	}

	static printGenericError(err) {
		console.log(err);
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

		console.log("[SOURCE HANDLER TESTS]");
		this.runSourceHandlerTests().forEach((e, i) => {
			e.errors.forEach(err => {
				console.log(err);
			});
			console.log(`TEST ${i+1}: ${e.ret}`);
			if(e.ret === "Failed!") num_of_failed_tests++;
		});
		console.log(""); // Break line

		console.log("[TOKENIZER TESTS]");
		let tktr = this.runTokenizerTests();

		console.log("(_isAlnum TESTS)");
		tktr[0].forEach((e, i) => {
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

	static runSourceHandlerTests() {
		let results = []

		const TESTS = require("./tests/sourceHandlerTests.json").content;

		TESTS.forEach(e => {
			let errors = [];
			const SOURCE_HANDLER = new SourceHandler(e.path);
			SOURCE_HANDLER.readFile();

			if(SOURCE_HANDLER._err !== SOURCE_HANDLER.getErr()) {
				errors.push("ERROR: '_err' doesn't equal 'getErr()'");
			}

			if(SOURCE_HANDLER._data !== SOURCE_HANDLER.getData()) {
				errors.push("ERROR: '_data' doesn't equal 'getData()'");
			}

			if(e.data !== SOURCE_HANDLER.getData()) {
				errors.push(`ERROR: expected data '${e.data}', but got '${SOURCE_HANDLER.getData()}'`);
			}

			if(e.err !== SOURCE_HANDLER.getErr()) {
				errors.push(`ERROR: expected error '${e.err}', but got '${SOURCE_HANDLER.getErr()}'`);
			}

			if(errors.length !== 0) {
				results.push({ret: "Failed!", errors: errors});
			} else {
				results.push({ret: "Succeeded!", errors: errors});
			}
		});

		return results;
	}

	static runTokenizerTests() {
		let results = [];
		results.push(this.runTokenizerIsAlnumTests());
		return results;
	}

	static runTokenizerIsAlnumTests() {
		let results = [];
		const TESTS = [
			{ in: '1', out: true},
			{ in: 'A', out: true},
			{ in: 'b', out: true},
			{ in: '#', out: false},
			{ in: '\n', out: false},
			{ in: '\0', out: false},
		];

		TESTS.forEach(e => {
			const TOKENIZER = new Tokenizer("");
			let result = TOKENIZER._isAlnum(e.in);

			if(result !== e.out) {
				results.push({ret: "Failed!", errors: [`Expected '${e.out}', got ${result}`]});
			} else {
				results.push({ret: "Succeeded!", errors: []});
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
			OutputHandler.printGenericError(OPTION_ERROR);
			return;
		}

		if(OPTIONS.getHelp()) {
			OutputHandler.printHelp();
		}

		if(!OPTIONS.shouldCompile()) {
			return;
		}

		const SOURCE_HANDLER = new SourceHandler(OPTIONS.getSourceFile());
		SOURCE_HANDLER.readFile();
		const SOURCE_HANDLER_ERR = SOURCE_HANDLER.getErr();

		if(SOURCE_HANDLER_ERR !== null) {
			OutputHandler.printSrcHandlerError(SOURCE_HANDLER_ERR);
			return;
		}

		const TOKENIZER = new Tokenizer(SOURCE_HANDLER.getData());
		TOKENIZER.tokenize();
		const TOKENIZER_ERR = TOKENIZER.getErr();

		if(TOKENIZER_ERR !== null) {
			OutputHandler.printGenericError(TOKENIZER_ERR);
		}
	}
}

// NOTE: COMMENT THIS IN RELEASE

//Tests.runTests();

// NOTE: UNCOMMENT THIS IN RELEASE

Main.main();
