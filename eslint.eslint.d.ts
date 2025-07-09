import {Linter} from "eslint";
type RuleValue = Linter.RuleEntry;
declare module "eslint" {
	namespace Linter {
		interface RulesRecord {
			/**
			💡
			Enforce return statements in callbacks of array methods
			*/
			"array-callback-return": RuleValue;
			/**
			✅
			Require super() calls in constructors
			*/
			"constructor-super": RuleValue;
			/**
			✅
			Enforce for loop update clause moving the counter in the right direction
			*/
			"for-direction": RuleValue;
			/**
			✅
			Enforce return statements in getters
			*/
			"getter-return": RuleValue;
			/**
			✅
			Disallow using an async function as a Promise executor
			*/
			"no-async-promise-executor": RuleValue;
			/**
			
			Disallow await inside of loops
			*/
			"no-await-in-loop": RuleValue;
			/**
			✅
			Disallow reassigning class members
			*/
			"no-class-assign": RuleValue;
			/**
			✅
			Disallow comparing against -0
			*/
			"no-compare-neg-zero": RuleValue;
			/**
			✅
			Disallow assignment operators in conditional expressions
			*/
			"no-cond-assign": RuleValue;
			/**
			✅
			Disallow reassigning const variables
			*/
			"no-const-assign": RuleValue;
			/**
			✅
			Disallow expressions where the operation doesn’t affect the value
			*/
			"no-constant-binary-expression": RuleValue;
			/**
			✅
			Disallow constant expressions in conditions
			*/
			"no-constant-condition": RuleValue;
			/**
			
			Disallow returning value from constructor
			*/
			"no-constructor-return": RuleValue;
			/**
			✅
			Disallow control characters in regular expressions
			*/
			"no-control-regex": RuleValue;
			/**
			✅
			Disallow the use of debugger
			*/
			"no-debugger": RuleValue;
			/**
			✅
			Disallow duplicate arguments in function definitions
			*/
			"no-dupe-args": RuleValue;
			/**
			✅
			Disallow duplicate class members
			*/
			"no-dupe-class-members": RuleValue;
			/**
			✅
			Disallow duplicate conditions in if-else-if chains
			*/
			"no-dupe-else-if": RuleValue;
			/**
			✅
			Disallow duplicate keys in object literals
			*/
			"no-dupe-keys": RuleValue;
			/**
			✅
			Disallow duplicate case labels
			*/
			"no-duplicate-case": RuleValue;
			/**
			
			Disallow duplicate module imports
			*/
			"no-duplicate-imports": RuleValue;
			/**
			✅
			Disallow empty character classes in regular expressions
			*/
			"no-empty-character-class": RuleValue;
			/**
			✅
			Disallow empty destructuring patterns
			*/
			"no-empty-pattern": RuleValue;
			/**
			✅
			Disallow reassigning exceptions in catch clauses
			*/
			"no-ex-assign": RuleValue;
			/**
			✅
			Disallow fallthrough of case statements
			*/
			"no-fallthrough": RuleValue;
			/**
			✅
			Disallow reassigning function declarations
			*/
			"no-func-assign": RuleValue;
			/**
			✅
			Disallow assigning to imported bindings
			*/
			"no-import-assign": RuleValue;
			/**
			
			Disallow variable or function declarations in nested blocks
			*/
			"no-inner-declarations": RuleValue;
			/**
			✅
			Disallow invalid regular expression strings in RegExp constructors
			*/
			"no-invalid-regexp": RuleValue;
			/**
			✅
			Disallow irregular whitespace
			*/
			"no-irregular-whitespace": RuleValue;
			/**
			✅
			Disallow literal numbers that lose precision
			*/
			"no-loss-of-precision": RuleValue;
			/**
			✅ 💡
			Disallow characters which are made with multiple code points in character class syntax
			*/
			"no-misleading-character-class": RuleValue;
			/**
			✅
			Disallow new operators with global non-constructor functions
			*/
			"no-new-native-nonconstructor": RuleValue;
			/**
			✅
			Disallow calling global object properties as functions
			*/
			"no-obj-calls": RuleValue;
			/**
			💡
			Disallow returning values from Promise executor functions
			*/
			"no-promise-executor-return": RuleValue;
			/**
			✅ 💡
			Disallow calling some Object.prototype methods directly on objects
			*/
			"no-prototype-builtins": RuleValue;
			/**
			✅
			Disallow assignments where both sides are exactly the same
			*/
			"no-self-assign": RuleValue;
			/**
			
			Disallow comparisons where both sides are exactly the same
			*/
			"no-self-compare": RuleValue;
			/**
			✅
			Disallow returning values from setters
			*/
			"no-setter-return": RuleValue;
			/**
			✅
			Disallow sparse arrays
			*/
			"no-sparse-arrays": RuleValue;
			/**
			
			Disallow template literal placeholder syntax in regular strings
			*/
			"no-template-curly-in-string": RuleValue;
			/**
			✅
			Disallow this/super before calling super() in constructors
			*/
			"no-this-before-super": RuleValue;
			/**
			
			Disallow let or var variables that are read but never assigned
			*/
			"no-unassigned-vars": RuleValue;
			/**
			✅
			Disallow the use of undeclared variables unless mentioned in /\*global *\/ comments
			*/
			"no-undef": RuleValue;
			/**
			✅
			Disallow confusing multiline expressions
			*/
			"no-unexpected-multiline": RuleValue;
			/**
			
			Disallow unmodified loop conditions
			*/
			"no-unmodified-loop-condition": RuleValue;
			/**
			✅
			Disallow unreachable code after return, throw, continue, and break statements
			*/
			"no-unreachable": RuleValue;
			/**
			
			Disallow loops with a body that allows only one iteration
			*/
			"no-unreachable-loop": RuleValue;
			/**
			✅
			Disallow control flow statements in finally blocks
			*/
			"no-unsafe-finally": RuleValue;
			/**
			✅ 💡
			Disallow negating the left operand of relational operators
			*/
			"no-unsafe-negation": RuleValue;
			/**
			✅
			Disallow use of optional chaining in contexts where the undefined value is not allowed
			*/
			"no-unsafe-optional-chaining": RuleValue;
			/**
			✅
			Disallow unused private class members
			*/
			"no-unused-private-class-members": RuleValue;
			/**
			✅ 💡
			Disallow unused variables
			*/
			"no-unused-vars": RuleValue;
			/**
			
			Disallow the use of variables before they are defined
			*/
			"no-use-before-define": RuleValue;
			/**
			
			Disallow variable assignments when the value is not used
			*/
			"no-useless-assignment": RuleValue;
			/**
			✅
			Disallow useless backreferences in regular expressions
			*/
			"no-useless-backreference": RuleValue;
			/**
			
			Disallow assignments that can lead to race conditions due to usage of await or yield
			*/
			"require-atomic-updates": RuleValue;
			/**
			✅ 💡
			Require calls to isNaN() when checking for NaN
			*/
			"use-isnan": RuleValue;
			/**
			✅ 💡
			Enforce comparing typeof expressions against valid strings
			*/
			"valid-typeof": RuleValue;
			/**
			
			Enforce getter and setter pairs in objects and classes
			*/
			"accessor-pairs": RuleValue;
			/**
			🔧
			Require braces around arrow function bodies
			*/
			"arrow-body-style": RuleValue;
			/**
			
			Enforce the use of variables within the scope they are defined
			*/
			"block-scoped-var": RuleValue;
			/**
			
			Enforce camelcase naming convention
			*/
			"camelcase": RuleValue;
			/**
			🔧
			Enforce or disallow capitalization of the first letter of a comment
			*/
			"capitalized-comments": RuleValue;
			/**
			
			Enforce that class methods utilize this
			*/
			"class-methods-use-this": RuleValue;
			/**
			
			Enforce a maximum cyclomatic complexity allowed in a program
			*/
			"complexity": RuleValue;
			/**
			
			Require return statements to either always or never specify values
			*/
			"consistent-return": RuleValue;
			/**
			
			Enforce consistent naming when capturing the current execution context
			*/
			"consistent-this": RuleValue;
			/**
			🔧
			Enforce consistent brace style for all control statements
			*/
			"curly": RuleValue;
			/**
			
			Require default cases in switch statements
			*/
			"default-case": RuleValue;
			/**
			
			Enforce default clauses in switch statements to be last
			*/
			"default-case-last": RuleValue;
			/**
			
			Enforce default parameters to be last
			*/
			"default-param-last": RuleValue;
			/**
			🔧
			Enforce dot notation whenever possible
			*/
			"dot-notation": RuleValue;
			/**
			🔧 💡
			Require the use of === and !==
			*/
			"eqeqeq": RuleValue;
			/**
			
			Require function names to match the name of the variable or property to which they are assigned
			*/
			"func-name-matching": RuleValue;
			/**
			
			Require or disallow named function expressions
			*/
			"func-names": RuleValue;
			/**
			
			Enforce the consistent use of either function declarations or expressions assigned to variables
			*/
			"func-style": RuleValue;
			/**
			
			Require grouped accessor pairs in object literals and classes
			*/
			"grouped-accessor-pairs": RuleValue;
			/**
			
			Require for-in loops to include an if statement
			*/
			"guard-for-in": RuleValue;
			/**
			
			Disallow specified identifiers
			*/
			"id-denylist": RuleValue;
			/**
			
			Enforce minimum and maximum identifier lengths
			*/
			"id-length": RuleValue;
			/**
			
			Require identifiers to match a specified regular expression
			*/
			"id-match": RuleValue;
			/**
			
			Require or disallow initialization in variable declarations
			*/
			"init-declarations": RuleValue;
			/**
			🔧 💡
			Require or disallow logical assignment operator shorthand
			*/
			"logical-assignment-operators": RuleValue;
			/**
			
			Enforce a maximum number of classes per file
			*/
			"max-classes-per-file": RuleValue;
			/**
			
			Enforce a maximum depth that blocks can be nested
			*/
			"max-depth": RuleValue;
			/**
			
			Enforce a maximum number of lines per file
			*/
			"max-lines": RuleValue;
			/**
			
			Enforce a maximum number of lines of code in a function
			*/
			"max-lines-per-function": RuleValue;
			/**
			
			Enforce a maximum depth that callbacks can be nested
			*/
			"max-nested-callbacks": RuleValue;
			/**
			
			Enforce a maximum number of parameters in function definitions
			*/
			"max-params": RuleValue;
			/**
			
			Enforce a maximum number of statements allowed in function blocks
			*/
			"max-statements": RuleValue;
			/**
			
			Require constructor names to begin with a capital letter
			*/
			"new-cap": RuleValue;
			/**
			
			Disallow the use of alert, confirm, and prompt
			*/
			"no-alert": RuleValue;
			/**
			🔧 💡
			Disallow Array constructors
			*/
			"no-array-constructor": RuleValue;
			/**
			
			Disallow bitwise operators
			*/
			"no-bitwise": RuleValue;
			/**
			
			Disallow the use of arguments.caller or arguments.callee
			*/
			"no-caller": RuleValue;
			/**
			✅ 💡
			Disallow lexical declarations in case clauses
			*/
			"no-case-declarations": RuleValue;
			/**
			💡
			Disallow the use of console
			*/
			"no-console": RuleValue;
			/**
			
			Disallow continue statements
			*/
			"no-continue": RuleValue;
			/**
			✅
			Disallow deleting variables
			*/
			"no-delete-var": RuleValue;
			/**
			🔧
			Disallow equal signs explicitly at the beginning of regular expressions
			*/
			"no-div-regex": RuleValue;
			/**
			🔧
			Disallow else blocks after return statements in if statements
			*/
			"no-else-return": RuleValue;
			/**
			✅ 💡
			Disallow empty block statements
			*/
			"no-empty": RuleValue;
			/**
			
			Disallow empty functions
			*/
			"no-empty-function": RuleValue;
			/**
			✅
			Disallow empty static blocks
			*/
			"no-empty-static-block": RuleValue;
			/**
			
			Disallow null comparisons without type-checking operators
			*/
			"no-eq-null": RuleValue;
			/**
			
			Disallow the use of eval()
			*/
			"no-eval": RuleValue;
			/**
			
			Disallow extending native types
			*/
			"no-extend-native": RuleValue;
			/**
			🔧
			Disallow unnecessary calls to .bind()
			*/
			"no-extra-bind": RuleValue;
			/**
			✅ 🔧
			Disallow unnecessary boolean casts
			*/
			"no-extra-boolean-cast": RuleValue;
			/**
			🔧
			Disallow unnecessary labels
			*/
			"no-extra-label": RuleValue;
			/**
			✅
			Disallow assignments to native objects or read-only global variables
			*/
			"no-global-assign": RuleValue;
			/**
			🔧 💡
			Disallow shorthand type conversions
			*/
			"no-implicit-coercion": RuleValue;
			/**
			
			Disallow declarations in the global scope
			*/
			"no-implicit-globals": RuleValue;
			/**
			
			Disallow the use of eval()-like methods
			*/
			"no-implied-eval": RuleValue;
			/**
			
			Disallow inline comments after code
			*/
			"no-inline-comments": RuleValue;
			/**
			
			Disallow use of this in contexts where the value of this is undefined
			*/
			"no-invalid-this": RuleValue;
			/**
			
			Disallow the use of the __iterator__ property
			*/
			"no-iterator": RuleValue;
			/**
			
			Disallow labels that share a name with a variable
			*/
			"no-label-var": RuleValue;
			/**
			
			Disallow labeled statements
			*/
			"no-labels": RuleValue;
			/**
			
			Disallow unnecessary nested blocks
			*/
			"no-lone-blocks": RuleValue;
			/**
			🔧
			Disallow if statements as the only statement in else blocks
			*/
			"no-lonely-if": RuleValue;
			/**
			
			Disallow function declarations that contain unsafe references inside loop statements
			*/
			"no-loop-func": RuleValue;
			/**
			
			Disallow magic numbers
			*/
			"no-magic-numbers": RuleValue;
			/**
			
			Disallow use of chained assignment expressions
			*/
			"no-multi-assign": RuleValue;
			/**
			
			Disallow multiline strings
			*/
			"no-multi-str": RuleValue;
			/**
			
			Disallow negated conditions
			*/
			"no-negated-condition": RuleValue;
			/**
			
			Disallow nested ternary expressions
			*/
			"no-nested-ternary": RuleValue;
			/**
			
			Disallow new operators outside of assignments or comparisons
			*/
			"no-new": RuleValue;
			/**
			
			Disallow new operators with the Function object
			*/
			"no-new-func": RuleValue;
			/**
			
			Disallow new operators with the String, Number, and Boolean objects
			*/
			"no-new-wrappers": RuleValue;
			/**
			✅ 💡
			Disallow &#92;8 and &#92;9 escape sequences in string literals
			*/
			"no-nonoctal-decimal-escape": RuleValue;
			/**
			💡
			Disallow calls to the Object constructor without an argument
			*/
			"no-object-constructor": RuleValue;
			/**
			✅
			Disallow octal literals
			*/
			"no-octal": RuleValue;
			/**
			
			Disallow octal escape sequences in string literals
			*/
			"no-octal-escape": RuleValue;
			/**
			
			Disallow reassigning function parameters
			*/
			"no-param-reassign": RuleValue;
			/**
			
			Disallow the unary operators ++ and --
			*/
			"no-plusplus": RuleValue;
			/**
			
			Disallow the use of the __proto__ property
			*/
			"no-proto": RuleValue;
			/**
			✅
			Disallow variable redeclaration
			*/
			"no-redeclare": RuleValue;
			/**
			✅ 🔧
			Disallow multiple spaces in regular expressions
			*/
			"no-regex-spaces": RuleValue;
			/**
			
			Disallow specified names in exports
			*/
			"no-restricted-exports": RuleValue;
			/**
			
			Disallow specified global variables
			*/
			"no-restricted-globals": RuleValue;
			/**
			
			Disallow specified modules when loaded by import
			*/
			"no-restricted-imports": RuleValue;
			/**
			
			Disallow certain properties on certain objects
			*/
			"no-restricted-properties": RuleValue;
			/**
			
			Disallow specified syntax
			*/
			"no-restricted-syntax": RuleValue;
			/**
			
			Disallow assignment operators in return statements
			*/
			"no-return-assign": RuleValue;
			/**
			
			Disallow javascript: URLs
			*/
			"no-script-url": RuleValue;
			/**
			
			Disallow comma operators
			*/
			"no-sequences": RuleValue;
			/**
			
			Disallow variable declarations from shadowing variables declared in the outer scope
			*/
			"no-shadow": RuleValue;
			/**
			✅
			Disallow identifiers from shadowing restricted names
			*/
			"no-shadow-restricted-names": RuleValue;
			/**
			
			Disallow ternary operators
			*/
			"no-ternary": RuleValue;
			/**
			
			Disallow throwing literals as exceptions
			*/
			"no-throw-literal": RuleValue;
			/**
			🔧
			Disallow initializing variables to undefined
			*/
			"no-undef-init": RuleValue;
			/**
			
			Disallow the use of undefined as an identifier
			*/
			"no-undefined": RuleValue;
			/**
			
			Disallow dangling underscores in identifiers
			*/
			"no-underscore-dangle": RuleValue;
			/**
			🔧
			Disallow ternary operators when simpler alternatives exist
			*/
			"no-unneeded-ternary": RuleValue;
			/**
			
			Disallow unused expressions
			*/
			"no-unused-expressions": RuleValue;
			/**
			✅ 🔧
			Disallow unused labels
			*/
			"no-unused-labels": RuleValue;
			/**
			
			Disallow unnecessary calls to .call() and .apply()
			*/
			"no-useless-call": RuleValue;
			/**
			✅
			Disallow unnecessary catch clauses
			*/
			"no-useless-catch": RuleValue;
			/**
			🔧
			Disallow unnecessary computed property keys in objects and classes
			*/
			"no-useless-computed-key": RuleValue;
			/**
			
			Disallow unnecessary concatenation of literals or template literals
			*/
			"no-useless-concat": RuleValue;
			/**
			💡
			Disallow unnecessary constructors
			*/
			"no-useless-constructor": RuleValue;
			/**
			✅ 💡
			Disallow unnecessary escape characters
			*/
			"no-useless-escape": RuleValue;
			/**
			🔧
			Disallow renaming import, export, and destructured assignments to the same name
			*/
			"no-useless-rename": RuleValue;
			/**
			🔧
			Disallow redundant return statements
			*/
			"no-useless-return": RuleValue;
			/**
			🔧
			Require let or const instead of var
			*/
			"no-var": RuleValue;
			/**
			
			Disallow void operators
			*/
			"no-void": RuleValue;
			/**
			
			Disallow specified warning terms in comments
			*/
			"no-warning-comments": RuleValue;
			/**
			✅
			Disallow with statements
			*/
			"no-with": RuleValue;
			/**
			🔧
			Require or disallow method and property shorthand syntax for object literals
			*/
			"object-shorthand": RuleValue;
			/**
			🔧
			Enforce variables to be declared either together or separately in functions
			*/
			"one-var": RuleValue;
			/**
			🔧
			Require or disallow assignment operator shorthand where possible
			*/
			"operator-assignment": RuleValue;
			/**
			🔧
			Require using arrow functions for callbacks
			*/
			"prefer-arrow-callback": RuleValue;
			/**
			🔧
			Require const declarations for variables that are never reassigned after declared
			*/
			"prefer-const": RuleValue;
			/**
			🔧
			Require destructuring from arrays and/or objects
			*/
			"prefer-destructuring": RuleValue;
			/**
			🔧
			Disallow the use of Math.pow in favor of the ** operator
			*/
			"prefer-exponentiation-operator": RuleValue;
			/**
			💡
			Enforce using named capture group in regular expression
			*/
			"prefer-named-capture-group": RuleValue;
			/**
			🔧
			Disallow parseInt() and Number.parseInt() in favor of binary, octal, and hexadecimal literals
			*/
			"prefer-numeric-literals": RuleValue;
			/**
			🔧
			Disallow use of Object.prototype.hasOwnProperty.call() and prefer use of Object.hasOwn()
			*/
			"prefer-object-has-own": RuleValue;
			/**
			🔧
			Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead
			*/
			"prefer-object-spread": RuleValue;
			/**
			
			Require using Error objects as Promise rejection reasons
			*/
			"prefer-promise-reject-errors": RuleValue;
			/**
			💡
			Disallow use of the RegExp constructor in favor of regular expression literals
			*/
			"prefer-regex-literals": RuleValue;
			/**
			
			Require rest parameters instead of arguments
			*/
			"prefer-rest-params": RuleValue;
			/**
			
			Require spread operators instead of .apply()
			*/
			"prefer-spread": RuleValue;
			/**
			🔧
			Require template literals instead of string concatenation
			*/
			"prefer-template": RuleValue;
			/**
			💡
			Enforce the consistent use of the radix argument when using parseInt()
			*/
			"radix": RuleValue;
			/**
			💡
			Disallow async functions which have no await expression
			*/
			"require-await": RuleValue;
			/**
			💡
			Enforce the use of u or v flag on regular expressions
			*/
			"require-unicode-regexp": RuleValue;
			/**
			✅
			Require generator functions to contain yield
			*/
			"require-yield": RuleValue;
			/**
			🔧
			Enforce sorted import declarations within modules
			*/
			"sort-imports": RuleValue;
			/**
			
			Require object keys to be sorted
			*/
			"sort-keys": RuleValue;
			/**
			🔧
			Require variables within the same declaration block to be sorted
			*/
			"sort-vars": RuleValue;
			/**
			🔧
			Require or disallow strict mode directives
			*/
			"strict": RuleValue;
			/**
			
			Require symbol descriptions
			*/
			"symbol-description": RuleValue;
			/**
			
			Require var declarations be placed at the top of their containing scope
			*/
			"vars-on-top": RuleValue;
			/**
			🔧
			Require or disallow “Yoda” conditions
			*/
			"yoda": RuleValue;
			/**
			🔧
			Require or disallow Unicode byte order mark (BOM)
			*/
			"unicode-bom": RuleValue;
		}
	}
}
