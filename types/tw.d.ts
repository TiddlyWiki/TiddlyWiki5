import * as Wiki from '../core/modules/wiki';

declare global {
  var $tw: {
    wiki: typeof Wiki;
  };
}
