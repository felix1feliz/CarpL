const fs = require("node:fs");
const process = require("node:process");

const VERSION = "v0.0.1";

let run_compile = true;
let input_file;
let output_file;

//////////////////
// ARGS PARSING //
//////////////////

const printHelp = () => {
	console.log("Usage:\n node clc.js <source> [flags]");
	console.log("Flags:");
	console.log(" -v --version:         print current version");
	console.log(" -h --help:            print help");
	console.log(" -o --output <output>: select output file");
}

const setFlags = (args) => {
	let i = 0
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
				if(output_file !== undefined) {
					args.splice(i, i);
					console.log("Output file must only be specified once");
					run_compile = false;
					break;
				}
				output_file = args[i+1];
				if(output_file.slice(-4, output_file.length) !== ".asm") {
					console.log("Wrong output file extension\nExpected: '.asm'");
					run_compile = false;
				}
				args.splice(i, i);
				break;
			default:
				i++
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
	if(readFile(args[2]) === undefined) {
		console.log(`Unknown file: ${args[2]}`);
		run_compile = false;
		return;
	}
	input_file = args[2];
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
	if(output_file === undefined) {
		output_file = input_file.slice(0, -3).concat(".asm");
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

/////////////////////////
// END OF ARGS PARSING //
/////////////////////////

const main = () => {
	if(!parseArgs(process.argv)) return;
	console.log(input_file);
	console.log(output_file);
}

main();
