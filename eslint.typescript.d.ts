import{ Linter } from"eslint"
type RuleValue = Linter.RuleEntry
declare module "eslint" {
  namespace Linter {
    interface RulesRecord {

      /** 
      🎨 Require that function overload signatures be consecutive
      */
      "@typescript-eslint/adjacent-overload-signatures": RuleValue;

      /** 
      🎨 Require consistently using either T[] or Array<T> for arrays
      */
      "@typescript-eslint/array-type": RuleValue;

      /** 
      ✅ Disallow @ts-<directive> comments or require descriptions after directives
      */
      "@typescript-eslint/ban-ts-comment": RuleValue;

      /** 
      🎨 Disallow // tslint:<rule-flag> comments
      */
      "@typescript-eslint/ban-tslint-comment": RuleValue;

      /** 
      🎨 Enforce that literals on classes are exposed in a consistent style
      */
      "@typescript-eslint/class-literal-property-style": RuleValue;

      /** 
      🎨 Enforce specifying generic type arguments on type annotation or constructor name of a constructor call
      */
      "@typescript-eslint/consistent-generic-constructors": RuleValue;

      /** 
      🎨 Require or disallow the Record type
      */
      "@typescript-eslint/consistent-indexed-object-style": RuleValue;

      /** 
      🎨 Enforce consistent usage of type assertions
      */
      "@typescript-eslint/consistent-type-assertions": RuleValue;

      /** 
      🎨 Enforce type definitions to consistently use either interface or type
      */
      "@typescript-eslint/consistent-type-definitions": RuleValue;

      /** 
       Enforce consistent usage of type imports
      */
      "@typescript-eslint/consistent-type-imports": RuleValue;

      /** 
       Require explicit return types on functions and class methods
      */
      "@typescript-eslint/explicit-function-return-type": RuleValue;

      /** 
       Require explicit accessibility modifiers on class properties and methods
      */
      "@typescript-eslint/explicit-member-accessibility": RuleValue;

      /** 
       Require explicit return and argument types on exported functions' and classes' public class methods
      */
      "@typescript-eslint/explicit-module-boundary-types": RuleValue;

      /** 
       Require a consistent member declaration order
      */
      "@typescript-eslint/member-ordering": RuleValue;

      /** 
       Enforce using a particular method signature syntax
      */
      "@typescript-eslint/method-signature-style": RuleValue;

      /** 
      🎨 Disallow non-null assertion in locations that may be confusing
      */
      "@typescript-eslint/no-confusing-non-null-assertion": RuleValue;

      /** 
      ✅ Disallow duplicate enum member values
      */
      "@typescript-eslint/no-duplicate-enum-values": RuleValue;

      /** 
      🔒 Disallow using the delete operator on computed key expressions
      */
      "@typescript-eslint/no-dynamic-delete": RuleValue;

      /** 
      ✅ Disallow accidentally using the "empty object" type
      */
      "@typescript-eslint/no-empty-object-type": RuleValue;

      /** 
      ✅ Disallow the any type
      */
      "@typescript-eslint/no-explicit-any": RuleValue;

      /** 
      ✅ Disallow extra non-null assertions
      */
      "@typescript-eslint/no-extra-non-null-assertion": RuleValue;

      /** 
      🔒 Disallow classes used as namespaces
      */
      "@typescript-eslint/no-extraneous-class": RuleValue;

      /** 
       Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
      */
      "@typescript-eslint/no-import-type-side-effects": RuleValue;

      /** 
      🎨 Disallow explicit type declarations for variables or parameters initialized to a number, string, or boolean
      */
      "@typescript-eslint/no-inferrable-types": RuleValue;

      /** 
      🔒 Disallow void type outside of generic or return types
      */
      "@typescript-eslint/no-invalid-void-type": RuleValue;

      /** 
      ✅ Enforce valid definition of new and constructor
      */
      "@typescript-eslint/no-misused-new": RuleValue;

      /** 
      ✅ Disallow TypeScript namespaces
      */
      "@typescript-eslint/no-namespace": RuleValue;

      /** 
      🔒 Disallow non-null assertions in the left operand of a nullish coalescing operator
      */
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": RuleValue;

      /** 
      ✅ Disallow non-null assertions after an optional chain expression
      */
      "@typescript-eslint/no-non-null-asserted-optional-chain": RuleValue;

      /** 
      🔒 Disallow non-null assertions using the ! postfix operator
      */
      "@typescript-eslint/no-non-null-assertion": RuleValue;

      /** 
      ✅ Disallow invocation of require()
      */
      "@typescript-eslint/no-require-imports": RuleValue;

      /** 
       Disallow certain types
      */
      "@typescript-eslint/no-restricted-types": RuleValue;

      /** 
      ✅ Disallow aliasing this
      */
      "@typescript-eslint/no-this-alias": RuleValue;

      /** 
       Disallow unnecessary assignment of constructor property parameter
      */
      "@typescript-eslint/no-unnecessary-parameter-property-assignment": RuleValue;

      /** 
      ✅ Disallow unnecessary constraints on generic types
      */
      "@typescript-eslint/no-unnecessary-type-constraint": RuleValue;

      /** 
      ✅ Disallow unsafe declaration merging
      */
      "@typescript-eslint/no-unsafe-declaration-merging": RuleValue;

      /** 
      ✅ Disallow using the unsafe built-in Function type
      */
      "@typescript-eslint/no-unsafe-function-type": RuleValue;

      /** 
       Disallow empty exports that don't change anything in a module file
      */
      "@typescript-eslint/no-useless-empty-export": RuleValue;

      /** 
      ✅ Disallow using confusing built-in primitive class wrappers
      */
      "@typescript-eslint/no-wrapper-object-types": RuleValue;

      /** 
       Require or disallow parameter properties in class constructors
      */
      "@typescript-eslint/parameter-properties": RuleValue;

      /** 
      ✅ Enforce the use of as const over literal type
      */
      "@typescript-eslint/prefer-as-const": RuleValue;

      /** 
       Require each enum member value to be explicitly initialized
      */
      "@typescript-eslint/prefer-enum-initializers": RuleValue;

      /** 
      🎨 Enforce the use of for-of loop over the standard for loop where possible
      */
      "@typescript-eslint/prefer-for-of": RuleValue;

      /** 
      🎨 Enforce using function types instead of interfaces with call signatures
      */
      "@typescript-eslint/prefer-function-type": RuleValue;

      /** 
      🔒 Require all enum members to be literal values
      */
      "@typescript-eslint/prefer-literal-enum-member": RuleValue;

      /** 
      ✅ Require using namespace keyword over module keyword to declare custom TypeScript modules
      */
      "@typescript-eslint/prefer-namespace-keyword": RuleValue;

      /** 
      ✅ Disallow certain triple slash directives in favor of ES6-style import declarations
      */
      "@typescript-eslint/triple-slash-reference": RuleValue;

      /** 
      🔒 Disallow two overloads that could be unified into one with a union or an optional/rest parameter
      */
      "@typescript-eslint/unified-signatures": RuleValue;
    }
  }
}
