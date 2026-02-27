/**
 * Type-level tests for the wiki module method signatures.
 *
 * These tests validate that JSDoc annotations on `core/modules/wiki.js`
 * produce useful TypeScript types for `$tw.wiki`.
 *
 * Run:
 *   npx tsc && npx tsc --noEmit -p types/tests/tsconfig.json
 */

// Import the generated declaration for the wiki module.
// This resolves to types/core/modules/wiki.d.ts after running tsc.
import type * as WikiMethods from '../core/modules/wiki';

// ---------------------------------------------------------------------------
// getTiddlerText return type
// ---------------------------------------------------------------------------

// ✅ The return type includes string, null, and undefined
type GetTiddlerTextReturn = ReturnType<typeof WikiMethods.getTiddlerText>;

// The return type must be assignable to `string | null | undefined`
declare const textResult: GetTiddlerTextReturn;
const _assigned: string | null | undefined = textResult;
void _assigned;

// ✅ `string` is assignable from the return (tiddler exists and is loaded)
// ✅ `null` is assignable from the return (tiddler is lazily loading)
// ✅ `undefined` is assignable from the return (tiddler not found with no default)

// ---------------------------------------------------------------------------
// getTiddlerText parameter types
// ---------------------------------------------------------------------------

declare const wikiLike: typeof WikiMethods;

// @ts-expect-error — cannot call without arguments; title is required
wikiLike.getTiddlerText();

// @ts-expect-error — title must be a string, not a number
wikiLike.getTiddlerText(42);

// ✅ Calling with a valid string title is fine
const _result1 = wikiLike.getTiddlerText("MyTiddler");
const _result2 = wikiLike.getTiddlerText("MyTiddler", "default text");

// @ts-expect-error — defaultText must be a string, not a number
const _result3 = wikiLike.getTiddlerText("MyTiddler", 42);

void _result1; void _result2; void _result3;

