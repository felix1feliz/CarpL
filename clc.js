const fs = require("node:fs");
const process = require("node:process");

class Keyword {
	constructor(value, pargs = 0, fargs = 0) {
		this.value = value;
		this.fargs = fargs;
		this.pargs = pargs;
	}
}

const VERSION = "v0.0.1";
const KEYWORDS = [
	new Keyword("OUT", 1),
	new Keyword("NOT", 1),
	new Keyword("AND", 1, 1),
	new Keyword("NAND", 1, 1),
	new Keyword("OR", 1, 1),
	new Keyword("NOR", 1, 1),
	new Keyword("XOR", 1, 1),
	new Keyword("XNOR", 1, 1),
];

let run_compile = true;
let source_code;
let source_path;
let output_path;

///////////////////////////////
// COMMAND LINE ARGS PARSING //
///////////////////////////////

const printHelp = () => {
	console.log("Usage:\n node clc.js <source> [flags]");
	console.log("Flags:");
	console.log(" -v --version:         print current version");
	console.log(" -h --help:            print help");
	console.log(" -o --output <output>: select output file");
}

const setFlags = (args) => {
	let i = 0;
	while(i < args.length) {
		switch(args[i]) {
			case "-v":
			case "--version":
				run_compile = false;
				console.log(VERSION);
				args.splice(i, i-1);
				break;
			case "-h":
			case "--help":
				run_compile = false;
				printHelp();
				args.splice(i, i-1);
				break;
			case "-o":
			case "--output":
				if(run_compile === false) {
					args.splice(i, i);
					break;
				}
				if(output_path !== undefined) {
					args.splice(i, i);
					console.log("Output file must only be specified once");
					run_compile = false;
					break;
				}
				output_path = args[i+1];
				if(output_path === undefined) {
					console.log("Flag '-o' requires an argument");
					run_compile = false;
				}
				if(output_path.slice(-4, output_path.length) !== ".asm") {
					console.log("Wrong output file extension\nExpected: '.asm'");
					run_compile = false;
				}
				args.splice(i, i);
				break;
			default:
				let argCopy = args[i];
				if(argCopy.slice(0, 1) === "-") {
					console.log(`Unknown flag ${argCopy}`);
					run_compile = false;
				}
				i++;
				break;
		}
	}
}

const setCompilerArgs = (args) => {
	// NOTE: ONLY SINGLE FILE APPLICATIONS EXIST FOR NOW
	// TODO: IMPLEMENT MULTIPLE FILES APPLICATION
	if(args[2] === undefined) {
		console.log("Source file not specified")
		run_compile = false;
		return;
	}
	if(args[2].slice(-3, args[2].length) !== ".cl") {
		console.log("Wrong source file extension\nExpected: '.cl'");
		run_compile = false;
		return;
	}
	if((source_code = readFile(args[2])) === undefined) {
		console.log(`Unknown file: ${args[2]}`);
		run_compile = false;
		return;
	}
	source_path = args[2];
}

const parseArgs = (args) => {
	if(args.length === 2) {
		printHelp();
		return false;
	}

	setFlags(args);
	if(!run_compile) return false;
	setCompilerArgs(args);
	if(!run_compile) return false;
	if(output_path === undefined) {
		output_path = source_path.slice(0, -3).concat(".asm");
	}
	return true;
}

const readFile = (file) => {
	try {
		const DATA = fs.readFileSync(file, "utf8");
		return DATA;
	} catch {
		return undefined;
	}
}

//////////////////////////////////////
// END OF COMMAND LINE ARGS PARSING //
//////////////////////////////////////

//////////////////
// TOKENIZATION //
//////////////////

class Token {
	constructor(type, value) {
		this.type = type;
		if(value !== undefined) this.value = value;
	}
}

const isLetter = (c) => {
	return c.toLowerCase() !== c.toUpperCase();
}

const isAlnum = (c) => {
	if(c === undefined) return false;
	if(c === "") return false;
	if(/\s/.test(c)) return false;
	if(!isLetter(c) && isNaN(c)) return false;
	return true;
}

const tokenize = (code) => {
	let tokens = [];
	let in_comment = false;
	for(let i = 0; i < code.length; i++) {
		if(code.charAt(i) === "\n") in_comment = false;
		if(in_comment) continue;

		if(code.charAt(i) === ":") tokens.push(new Token("VARDEF"));

		if(code.charAt(i) === ";") {
			tokens.push(new Token("EOL"))
			in_comment = true;
		};

		if(code.charAt(i) === "0" || code.charAt(i) === "1") tokens.push(new Token(
			"VALUE",
			code.charAt(i)
		));

		if(isLetter(code.charAt(i))) {
			let buffer = code.charAt(i);
			i++;
			while(isAlnum(code.charAt(i))) {
				buffer = buffer.concat(code.charAt(i));
				i++;
			}
			i--;
			let is_keyword = false;
			KEYWORDS.forEach(e => {
				if(e.value === (buffer)) {
					tokens.push(new Token("KEYWORD", e))
					is_keyword = true;
				};
			});
			if(!is_keyword) tokens.push(new Token("NAME", buffer));
		}
	}
	console.log(tokens);
	return tokens;
}

/////////////////////////
// END OF TOKENIZATION //
/////////////////////////

const main = () => {
	if(!parseArgs(process.argv)) return;
	console.log(`[SOURCE PATH] ${source_path}`);
	let tokens = tokenize(source_code);
	console.log(`[START OF CODE]\n${source_code}[END OF CODE]`);
	console.log(`[OUTPUT PATH] ${output_path}`);
}

main();
