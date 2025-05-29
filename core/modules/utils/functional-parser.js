/*\
title: $:/core/modules/utils/functional-parser.js
type: application/javascript
module-type: library

A functional combinator parser: Each library function accepts 
several parsers as input and returns a new parser for a specific task as its output.

For example the 'sequenceOf' combinator takes an array of parsers to attempt in sequence. 
It is an example of how parser combinators enable a recursive descent parsing strategy 
that facilitates modular piecewise construction and testing. 

The libary is based on a tutorial by lowbyteproductions at 
https://www.youtube.com/watch?v=6oQLRhw5Ah0&t=4s 

TODO: Rename str function as literal. Ensure any use of regex specific charaters is handled correctly.

\*/

"use strict";

(function(){
    const updateParserState = (state, index, result) => ({
      ...state,
      index,
      result
    });
    
    const updateParserResult = (state, result) => ({
      ...state,
      result
    });
    
    const updateParserSuggetions = (state, result, suggestions) => ({
      ...state,
      result,
      suggestions
    });
    
    const updateParserError = (state, errorMsg) => ({
      ...state,
      isError: true,
      error: errorMsg
    });
    
    class Parser {
      constructor(parserStateTransformerFn) {
        this.parserStateTransformerFn = parserStateTransformerFn;
      }
    
      run(target) {
        const initialState = {
          target,
          index: 0,
          result: null,
          isError: false,
          error: null
        };
    
        return this.parserStateTransformerFn(initialState);
      }
    
      map(fn) {
        return new Parser(parserState => {
          const nextState = this.parserStateTransformerFn(parserState);
    
          if (nextState.isError) return nextState;
    
          return updateParserResult(nextState, fn(nextState.result));
        });
      }
    
      chain(fn) {
        return new Parser(parserState => {
          const nextState = this.parserStateTransformerFn(parserState);
    
          if (nextState.isError) return nextState;
    
          const nextParser = fn(nextState.result);
    
          return nextParser.parserStateTransformerFn(nextState);
        });
      }
    
      errorMap(fn) {
        return new Parser(parserState => {
          const nextState = this.parserStateTransformerFn(parserState);
    
          if (!nextState.isError) return nextState;
    
          return updateParserError(nextState, fn(nextState.error, nextState.index));
        });
      }
    }
    
    const regex = re => new Parser(parserState => {
      const { target, index, isError } = parserState;
    
      if (isError) {
        return parserState;
      }
    
      const slicedTarget = target.slice(index)
    
      if (slicedTarget.length === 0) {
        return updateParserError(parserState, `regex: Got Unexpected end of input.`);
      }
    
      const regexMatch = slicedTarget.match(re);
    
      if (regexMatch && regexMatch[0].length > 0) {
        return updateParserState(parserState, index + regexMatch.index + regexMatch[0].length, regexMatch[0]);
      }
    
      return updateParserError(
        parserState,
        `regex: Couldn't find at index ${index}`
      );
    });
    
    const str = s => regex(new RegExp(`^${s}`)).errorMap((error, index) => error.replace('regex: ', `str('${s}'): `));
    const letters = regex(/^[A-Za-z]+/).errorMap((error, index) => error.replace('regex: ', `letters: `));
    const digits = regex(/^[0-9]+/).errorMap((error, index) => error.replace('regex: ', `digits: `));
    
    const sequenceOf = parsers => new Parser(parserState => {
      if (parserState.isError) {
        return parserState;
      }
    
      const results = [];
      let nextState = parserState;
    
      for (let p of parsers) {
        nextState = p.parserStateTransformerFn(nextState);
        results.push(nextState.result);
      }
    
      if (nextState.isError) {
        return nextState;
      }
    
      return updateParserResult(nextState, results);
    })
    
    const choice = parsers => new Parser(parserState => {
      if (parserState.isError) {
        return parserState;
      }
    
      for (let p of parsers) {
        const nextState = p.parserStateTransformerFn(parserState);
        if (!nextState.isError) {
          return nextState;
        }
      }
    
      return updateParserError(
        parserState,
        `choice: Unable to match with any parser at index ${parserState.index}`
      );
    });
    
    const many = parser => new Parser(parserState => {
      if (parserState.isError) {
        return parserState;
      }
    
      let nextState = parserState;
      const results = [];
      let done = false;
    
      while (!done) {
        let testState = parser.parserStateTransformerFn(nextState);
    
        if (!testState.isError) {
          results.push(testState.result);
          nextState = testState;
        } else {
          done = true;
        }
      }
    
      return updateParserResult(nextState, results);
    });
    
    const many1 = parser => new Parser(parserState => {
      if (parserState.isError) {
        return parserState;
      }
    
      let nextState = parserState;
      const results = [];
      let done = false;
    
      while (!done) {
        const nextState = parser.parserStateTransformerFn(nextState);
        if (!nextState.isError) {
          results.push(nextState.result);
        } else {
          done = true;
        }
      }
    
      if (results.length === 0) {
        return updateParserError(
          parserState,
          `many1: Unable to match any input using parser @ index ${parserState.index}`
        );
      }
    
      return updateParserResult(nextState, results);
    });
    
    
    const sepBy = separatorParser => valueParser => new Parser(parserState => {
      if (parserState.isError) {
        return parserState;
      }
    
      const results = [];
      let nextState = parserState;
    
      while (true) {
        const thingWeWantState = valueParser.parserStateTransformerFn(nextState);
        if (thingWeWantState.isError) {
          break;
        }
        results.push(thingWeWantState.result);
        nextState = thingWeWantState;
    
        const separatorState = separatorParser.parserStateTransformerFn(nextState);
        if (separatorState.isError) {
          break;
        }
        nextState = separatorState;
      }
    
      return updateParserResult(nextState, results);
    });
    
    const sepBy1 = separatorParser => valueParser => new Parser(parserState => {
      if (parserState.isError) {
        return parserState;
      }
    
      const results = [];
      let nextState = parserState;
    
      while (true) {
        const thingWeWantState = valueParser.parserStateTransformerFn(nextState);
        if (thingWeWantState.isError) {
          break;
        }
        results.push(thingWeWantState.result);
        nextState = thingWeWantState;
    
        const separatorState = separatorParser.parserStateTransformerFn(nextState);
        if (separatorState.isError) {
          break;
        }
        nextState = separatorState;
      }
    
      if (results.length === 0) {
        return updateParserError(
          parserState,
          `sepBy1: Unable to capture any results at index ${parserState.index}`
        );
      }
    
      return updateParserResult(nextState, results);
    });
    
    
    const between = (leftParser, rightParser) => contentParser => sequenceOf([
      leftParser,
      contentParser,
      rightParser
    ]).map(results => results[1]);
    
    const lazy = parserThunk => new Parser(parserState => {
      const parser = parserThunk();
      return parser.parserStateTransformerFn(parserState);
    });
    
    const allbut = butParser => new Parser(parserState => {
      const { target, index, isError } = parserState;
    
      if (isError) {
        return parserState;
      }
    
      const butMatchState = butParser.parserStateTransformerFn(parserState);
      if (butMatchState.isError){
        return updateParserState(parserState, target.length, target.slice(index));
      }else {
        const newIndex = butMatchState.index - butMatchState.result.length;
        return updateParserState(parserState, newIndex, target.slice(index, newIndex));
      }
    });
    
    const suggest = suggestions => new Parser(parserState => {
      if (parserState.isError) {
        return parserState;
      }
    
      let nextState = letters.parserStateTransformerFn(parserState);
      if (!nextState.isError) {
        const matchingSuggestions = suggestions.filter(suggestion =>
          suggestion.startsWith(nextState.result) && suggestion.length > nextState.result.length
        );
        return updateParserSuggetions(nextState, nextState.result, matchingSuggestions);
      }
    }).errorMap((error, index) => error.replace('letters: ', `suggest: `));
    
    const parserLibrary = {letters , sequenceOf, regex, sepBy, str, allbut}
      
    exports.parserLibrary = parserLibrary ;
    
    })();