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

const TESTS = [
	{ value: "1", result: true},
	{ value: "2", result: true},
	{ value: "3", result: true},
	{ value: "4", result: true},
	{ value: "5", result: true},
	{ value: "6", result: true},
	{ value: "7", result: true},
	{ value: "8", result: true},
	{ value: "9", result: true},
	{ value: "", result: false},
	{ value: " ", result: false},
	{ value: "	", result: false},
	{ value: "\n", result: false},
	{ value: "%", result: false},
	{ value: undefined, result: false},
	{ value: "a", result: true},
	{ value: "B", result: true},
]

TESTS.forEach(e => {
	if(isAlnum(e.value) === e.result) {
		console.log(`Test '${e.value}' passed`);
		return;
	}
	console.log(`Test '${e.value}' failed`);
});

