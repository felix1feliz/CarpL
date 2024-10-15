# CarpL Compiler

CarpL (or Carp Language) is a toy language for messing with logical operators. CLC (or CarpL Compiler) turns the toy language into nasm x86_64 for gnu-linux. To run clc you need node. Here is the command for using clc:
```bash
node clc.js
```

## How the language will work

### Comments

This is how you write comments in CarpL:
```
; This is a comment
; The comments extend until the end of the line
```

### Literals

There are two literals in CarpL. The value 1 and the value 0, representing the boolean values true and false.

### Operations

These are the operations:
```
!0     ; "NOT" operation
1 AND  1
0 NAND 0
0 XOR  1
1 XNOR 1
1 OR   1
0 NOR  0
```

They are arranged in order of precedence, but the "not" variant of an operation is considered to be in the same level of precedence as the default variant. Example:

`a AND b OR c` = `(a AND b) OR c`
`a AND b OR c XOR d XNOR e` = `(a AND b) OR (c XOR d XNOR e)`

The usage of "()" creates a sub expression.

### Variables

There are two ways to define a variable in CarpL. You may define them as an input given at the start of the execution or as a result of an expression. This is how you do it:
```
; This is an input variable
INP var1
; This is an expression variable
:var2 !var1
```

### Output

This is how you output the value of a variable:
```
OUT var
```

