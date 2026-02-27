/**
 * Global ambient type declarations for TiddlyWiki's `$tw` object.
 *
 * These types are augmented by running `tsc` in the project root, which
 * generates declaration files in `types/core/` from the JSDoc-annotated
 * source in `core/`. Plugin developers can then import specific types like:
 *
 * ```ts
 * import type { ParseTreeCodeblockNode } from 'tiddlywiki/types/core/modules/parsers/wikiparser/rules/codeblock';
 * ```
 */

import type * as WikiMethods from '$:/core/modules/wiki';

declare global {
  /**
   * The global TiddlyWiki object available in all TiddlyWiki JavaScript modules.
   * Use `$tw.wiki` to access the active wiki instance.
   */
  var $tw: {
    /** The active wiki instance exposing all wiki methods. */
    wiki: typeof WikiMethods;
    /** Whether we are running in a browser environment. */
    browser: boolean | undefined;
    /** TiddlyWiki utility functions. */
    utils: {
      [key: string]: (...args: any[]) => any;
    };
    /** Loaded modules registry. */
    modules: {
      applyMethods(moduleType: string): Record<string, any>;
      createClassesFromModules(moduleType: string, subtype: string, baseClass?: object): Record<string, any>;
      forEachModuleOfType(type: string, callback: (title: string, module: any) => void): void;
      [key: string]: any;
    };
    /** Language utilities. */
    language: {
      getRawString(title: string): string;
      [key: string]: any;
    };
    /** Safe mode flag. */
    safeMode: boolean;
    /** Configuration object. */
    config: {
      htmlVoidElements: string[];
      [key: string]: any;
    };
    /** Wiki rule base class constructor. */
    WikiRuleBase: new (...args: any[]) => any;
    [key: string]: any;
  };
}

export {};
