import {Linter} from "eslint";
import stylistic from "@stylistic/eslint-plugin";
type rules = keyof typeof stylistic.rules;
type RuleValue = Linter.RuleEntry;
declare module "eslint" {
	namespace Linter {
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		interface RulesRecord extends Record<`@stylistic/${rules}`,RuleValue> {}
	}
}
