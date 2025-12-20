'use strict';

const defaultOptions = /* @__PURE__ */ Object.freeze({
  diffTimeout: 1,
  diffEditCost: 4,
  matchThreshold: 0.5,
  matchDistance: 1e3,
  patchDeleteThreshold: 0.5,
  patchMargin: 4,
  matchMaxBits: 32
});
function resolveOptions(options) {
  if (options?.__resolved)
    return options;
  const resolved = {
    ...defaultOptions,
    ...options
  };
  Object.defineProperty(resolved, "__resolved", { value: true, enumerable: false });
  return resolved;
}

const DIFF_DELETE = -1;
const DIFF_INSERT = 1;
const DIFF_EQUAL = 0;
function createDiff(op, text) {
  return [op, text];
}
function diffMain(text1, text2, options, opt_checklines = true, opt_deadline) {
  const resolved = resolveOptions(options);
  if (typeof opt_deadline == "undefined") {
    if (resolved.diffTimeout <= 0)
      opt_deadline = Number.MAX_VALUE;
    else
      opt_deadline = (/* @__PURE__ */ new Date()).getTime() + resolved.diffTimeout * 1e3;
  }
  const deadline = opt_deadline;
  if (text1 == null || text2 == null)
    throw new Error("Null input. (diff_main)");
  if (text1 === text2) {
    if (text1)
      return [createDiff(DIFF_EQUAL, text1)];
    return [];
  }
  const checklines = opt_checklines;
  let commonlength = diffCommonPrefix(text1, text2);
  const commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);
  commonlength = diffCommonSuffix(text1, text2);
  const commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);
  const diffs = diffCompute(text1, text2, resolved, checklines, deadline);
  if (commonprefix)
    diffs.unshift(createDiff(DIFF_EQUAL, commonprefix));
  if (commonsuffix)
    diffs.push(createDiff(DIFF_EQUAL, commonsuffix));
  diffCleanupMerge(diffs);
  return diffs;
}
function diffCompute(text1, text2, options, checklines, deadline) {
  let diffs;
  if (!text1) {
    return [createDiff(DIFF_INSERT, text2)];
  }
  if (!text2) {
    return [createDiff(DIFF_DELETE, text1)];
  }
  const longtext = text1.length > text2.length ? text1 : text2;
  const shorttext = text1.length > text2.length ? text2 : text1;
  const i = longtext.indexOf(shorttext);
  if (i !== -1) {
    diffs = [createDiff(DIFF_INSERT, longtext.substring(0, i)), createDiff(DIFF_EQUAL, shorttext), createDiff(DIFF_INSERT, longtext.substring(i + shorttext.length))];
    if (text1.length > text2.length)
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    return diffs;
  }
  if (shorttext.length === 1) {
    return [createDiff(DIFF_DELETE, text1), createDiff(DIFF_INSERT, text2)];
  }
  const hm = diffHalfMatch(text1, text2, options);
  if (hm) {
    const text1_a = hm[0];
    const text1_b = hm[1];
    const text2_a = hm[2];
    const text2_b = hm[3];
    const mid_common = hm[4];
    const diffs_a = diffMain(text1_a, text2_a, options, checklines, deadline);
    const diffs_b = diffMain(text1_b, text2_b, options, checklines, deadline);
    return diffs_a.concat([createDiff(DIFF_EQUAL, mid_common)], diffs_b);
  }
  if (checklines && text1.length > 100 && text2.length > 100)
    return diffLineMode(text1, text2, options, deadline);
  return diffBisect(text1, text2, options, deadline);
}
function diffLineMode(text1, text2, options, deadline) {
  const a = diffLinesToChars(text1, text2);
  text1 = a.chars1;
  text2 = a.chars2;
  const linearray = a.lineArray;
  const diffs = diffMain(text1, text2, options, false, deadline);
  diffCharsToLines(diffs, linearray);
  diffCleanupSemantic(diffs);
  diffs.push(createDiff(DIFF_EQUAL, ""));
  let pointer = 0;
  let count_delete = 0;
  let count_insert = 0;
  let text_delete = "";
  let text_insert = "";
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        break;
      case DIFF_EQUAL:
        if (count_delete >= 1 && count_insert >= 1) {
          diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert);
          pointer = pointer - count_delete - count_insert;
          const subDiff = diffMain(text_delete, text_insert, options, false, deadline);
          for (let j = subDiff.length - 1; j >= 0; j--)
            diffs.splice(pointer, 0, subDiff[j]);
          pointer = pointer + subDiff.length;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = "";
        text_insert = "";
        break;
    }
    pointer++;
  }
  diffs.pop();
  return diffs;
}
function diffBisect(text1, text2, options, deadline) {
  const text1_length = text1.length;
  const text2_length = text2.length;
  const max_d = Math.ceil((text1_length + text2_length) / 2);
  const v_offset = max_d;
  const v_length = 2 * max_d;
  const v1 = new Array(v_length);
  const v2 = new Array(v_length);
  for (let x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  const delta = text1_length - text2_length;
  const front = delta % 2 !== 0;
  let k1start = 0;
  let k1end = 0;
  let k2start = 0;
  let k2end = 0;
  for (let d = 0; d < max_d; d++) {
    if ((/* @__PURE__ */ new Date()).getTime() > deadline)
      break;
    for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      const k1_offset = v_offset + k1;
      let x1;
      if (k1 === -d || k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])
        x1 = v1[k1_offset + 1];
      else
        x1 = v1[k1_offset - 1] + 1;
      let y1 = x1 - k1;
      while (x1 < text1_length && y1 < text2_length && text1.charAt(x1) === text2.charAt(y1)) {
        x1++;
        y1++;
      }
      v1[k1_offset] = x1;
      if (x1 > text1_length) {
        k1end += 2;
      } else if (y1 > text2_length) {
        k1start += 2;
      } else if (front) {
        const k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
          const x2 = text1_length - v2[k2_offset];
          if (x1 >= x2) {
            return diffBisectSplit(text1, text2, options, x1, y1, deadline);
          }
        }
      }
    }
    for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      const k2_offset = v_offset + k2;
      let x2;
      if (k2 === -d || k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])
        x2 = v2[k2_offset + 1];
      else
        x2 = v2[k2_offset - 1] + 1;
      let y2 = x2 - k2;
      while (x2 < text1_length && y2 < text2_length && text1.charAt(text1_length - x2 - 1) === text2.charAt(text2_length - y2 - 1)) {
        x2++;
        y2++;
      }
      v2[k2_offset] = x2;
      if (x2 > text1_length) {
        k2end += 2;
      } else if (y2 > text2_length) {
        k2start += 2;
      } else if (!front) {
        const k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
          const x1 = v1[k1_offset];
          const y1 = v_offset + x1 - k1_offset;
          x2 = text1_length - x2;
          if (x1 >= x2) {
            return diffBisectSplit(text1, text2, options, x1, y1, deadline);
          }
        }
      }
    }
  }
  return [createDiff(DIFF_DELETE, text1), createDiff(DIFF_INSERT, text2)];
}
function diffBisectSplit(text1, text2, options, x, y, deadline) {
  const text1a = text1.substring(0, x);
  const text2a = text2.substring(0, y);
  const text1b = text1.substring(x);
  const text2b = text2.substring(y);
  const diffs = diffMain(text1a, text2a, options, false, deadline);
  const diffsb = diffMain(text1b, text2b, options, false, deadline);
  return diffs.concat(diffsb);
}
function diffLinesToChars(text1, text2) {
  const lineArray = [];
  const lineHash = {};
  let maxLines = 4e4;
  lineArray[0] = "";
  function diffLinesToCharsMunge(text) {
    let chars = "";
    let lineStart = 0;
    let lineEnd = -1;
    let lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf("\n", lineStart);
      if (lineEnd === -1)
        lineEnd = text.length - 1;
      let line = text.substring(lineStart, lineEnd + 1);
      if (lineHash.hasOwnProperty ? Object.prototype.hasOwnProperty.call(lineHash, line) : lineHash[line] !== undefined) {
        chars += String.fromCharCode(lineHash[line]);
      } else {
        if (lineArrayLength === maxLines) {
          line = text.substring(lineStart);
          lineEnd = text.length;
        }
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
      lineStart = lineEnd + 1;
    }
    return chars;
  }
  const chars1 = diffLinesToCharsMunge(text1);
  maxLines = 65535;
  const chars2 = diffLinesToCharsMunge(text2);
  return { chars1, chars2, lineArray };
}
function diffCharsToLines(diffs, lineArray) {
  for (let i = 0; i < diffs.length; i++) {
    const chars = diffs[i][1];
    const text = [];
    for (let j = 0; j < chars.length; j++)
      text[j] = lineArray[chars.charCodeAt(j)];
    diffs[i][1] = text.join("");
  }
}
function diffCommonPrefix(text1, text2) {
  if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0))
    return 0;
  let pointermin = 0;
  let pointermax = Math.min(text1.length, text2.length);
  let pointermid = pointermax;
  let pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) === text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
}
function diffCommonSuffix(text1, text2) {
  if (!text1 || !text2 || text1.charAt(text1.length - 1) !== text2.charAt(text2.length - 1)) {
    return 0;
  }
  let pointermin = 0;
  let pointermax = Math.min(text1.length, text2.length);
  let pointermid = pointermax;
  let pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) === text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
}
function diffCommonOverlap(text1, text2) {
  const text1_length = text1.length;
  const text2_length = text2.length;
  if (text1_length === 0 || text2_length === 0)
    return 0;
  if (text1_length > text2_length)
    text1 = text1.substring(text1_length - text2_length);
  else if (text1_length < text2_length)
    text2 = text2.substring(0, text1_length);
  const text_length = Math.min(text1_length, text2_length);
  if (text1 === text2)
    return text_length;
  let best = 0;
  let length = 1;
  while (true) {
    const pattern = text1.substring(text_length - length);
    const found = text2.indexOf(pattern);
    if (found === -1)
      return best;
    length += found;
    if (found === 0 || text1.substring(text_length - length) === text2.substring(0, length)) {
      best = length;
      length++;
    }
  }
}
function diffHalfMatch(text1, text2, options) {
  if (options.diffTimeout <= 0) {
    return null;
  }
  const longtext = text1.length > text2.length ? text1 : text2;
  const shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length)
    return null;
  function diffHalfMatchI(longtext2, shorttext2, i) {
    const seed = longtext2.substring(i, i + Math.floor(longtext2.length / 4));
    let j = -1;
    let best_common = "";
    let best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext2.indexOf(seed, j + 1)) !== -1) {
      const prefixLength = diffCommonPrefix(longtext2.substring(i), shorttext2.substring(j));
      const suffixLength = diffCommonSuffix(longtext2.substring(0, i), shorttext2.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext2.substring(j - suffixLength, j) + shorttext2.substring(j, j + prefixLength);
        best_longtext_a = longtext2.substring(0, i - suffixLength);
        best_longtext_b = longtext2.substring(i + prefixLength);
        best_shorttext_a = shorttext2.substring(0, j - suffixLength);
        best_shorttext_b = shorttext2.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext2.length)
      return [best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b, best_common];
    else
      return null;
  }
  const hm1 = diffHalfMatchI(longtext, shorttext, Math.ceil(longtext.length / 4));
  const hm2 = diffHalfMatchI(longtext, shorttext, Math.ceil(longtext.length / 2));
  let hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }
  let text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  const mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
}
function diffCleanupSemantic(diffs) {
  let changes = false;
  const equalities = [];
  let equalitiesLength = 0;
  let lastEquality = null;
  let pointer = 0;
  let length_insertions1 = 0;
  let length_deletions1 = 0;
  let length_insertions2 = 0;
  let length_deletions2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] === DIFF_EQUAL) {
      equalities[equalitiesLength++] = pointer;
      length_insertions1 = length_insertions2;
      length_deletions1 = length_deletions2;
      length_insertions2 = 0;
      length_deletions2 = 0;
      lastEquality = diffs[pointer][1];
    } else {
      if (diffs[pointer][0] === DIFF_INSERT)
        length_insertions2 += diffs[pointer][1].length;
      else
        length_deletions2 += diffs[pointer][1].length;
      if (lastEquality && lastEquality.length <= Math.max(length_insertions1, length_deletions1) && lastEquality.length <= Math.max(length_insertions2, length_deletions2)) {
        diffs.splice(equalities[equalitiesLength - 1], 0, createDiff(DIFF_DELETE, lastEquality));
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_insertions1 = 0;
        length_deletions1 = 0;
        length_insertions2 = 0;
        length_deletions2 = 0;
        lastEquality = null;
        changes = true;
      }
    }
    pointer++;
  }
  if (changes)
    diffCleanupMerge(diffs);
  diffCleanupSemanticLossless(diffs);
  pointer = 1;
  while (pointer < diffs.length) {
    if (diffs[pointer - 1][0] === DIFF_DELETE && diffs[pointer][0] === DIFF_INSERT) {
      const deletion = diffs[pointer - 1][1];
      const insertion = diffs[pointer][1];
      const overlap_length1 = diffCommonOverlap(deletion, insertion);
      const overlap_length2 = diffCommonOverlap(insertion, deletion);
      if (overlap_length1 >= overlap_length2) {
        if (overlap_length1 >= deletion.length / 2 || overlap_length1 >= insertion.length / 2) {
          diffs.splice(pointer, 0, createDiff(DIFF_EQUAL, insertion.substring(0, overlap_length1)));
          diffs[pointer - 1][1] = deletion.substring(0, deletion.length - overlap_length1);
          diffs[pointer + 1][1] = insertion.substring(overlap_length1);
          pointer++;
        }
      } else {
        if (overlap_length2 >= deletion.length / 2 || overlap_length2 >= insertion.length / 2) {
          diffs.splice(pointer, 0, createDiff(DIFF_EQUAL, deletion.substring(0, overlap_length2)));
          diffs[pointer - 1][0] = DIFF_INSERT;
          diffs[pointer - 1][1] = insertion.substring(0, insertion.length - overlap_length2);
          diffs[pointer + 1][0] = DIFF_DELETE;
          diffs[pointer + 1][1] = deletion.substring(overlap_length2);
          pointer++;
        }
      }
      pointer++;
    }
    pointer++;
  }
}
const nonAlphaNumericRegex_ = /[^a-z0-9]/i;
const whitespaceRegex_ = /\s/;
const linebreakRegex_ = /[\r\n]/;
const blanklineEndRegex_ = /\n\r?\n$/;
const blanklineStartRegex_ = /^\r?\n\r?\n/;
function diffCleanupSemanticLossless(diffs) {
  function diffCleanupSemanticScore(one, two) {
    if (!one || !two) {
      return 6;
    }
    const char1 = one.charAt(one.length - 1);
    const char2 = two.charAt(0);
    const nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex_);
    const nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex_);
    const whitespace1 = nonAlphaNumeric1 && char1.match(whitespaceRegex_);
    const whitespace2 = nonAlphaNumeric2 && char2.match(whitespaceRegex_);
    const lineBreak1 = whitespace1 && char1.match(linebreakRegex_);
    const lineBreak2 = whitespace2 && char2.match(linebreakRegex_);
    const blankLine1 = lineBreak1 && one.match(blanklineEndRegex_);
    const blankLine2 = lineBreak2 && two.match(blanklineStartRegex_);
    if (blankLine1 || blankLine2) {
      return 5;
    } else if (lineBreak1 || lineBreak2) {
      return 4;
    } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
      return 3;
    } else if (whitespace1 || whitespace2) {
      return 2;
    } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
      return 1;
    }
    return 0;
  }
  let pointer = 1;
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] === DIFF_EQUAL && diffs[pointer + 1][0] === DIFF_EQUAL) {
      let equality1 = diffs[pointer - 1][1];
      let edit = diffs[pointer][1];
      let equality2 = diffs[pointer + 1][1];
      const commonOffset = diffCommonSuffix(equality1, edit);
      if (commonOffset) {
        const commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }
      let bestEquality1 = equality1;
      let bestEdit = edit;
      let bestEquality2 = equality2;
      let bestScore = diffCleanupSemanticScore(equality1, edit) + diffCleanupSemanticScore(edit, equality2);
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0);
        edit = edit.substring(1) + equality2.charAt(0);
        equality2 = equality2.substring(1);
        const score = diffCleanupSemanticScore(equality1, edit) + diffCleanupSemanticScore(edit, equality2);
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }
      if (diffs[pointer - 1][1] !== bestEquality1) {
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
}
function diffCleanupEfficiency(diffs, options = {}) {
  const {
    diffEditCost = defaultOptions.diffEditCost
  } = options;
  let changes = false;
  const equalities = [];
  let equalitiesLength = 0;
  let lastEquality = null;
  let pointer = 0;
  let pre_ins = false;
  let pre_del = false;
  let post_ins = false;
  let post_del = false;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] === DIFF_EQUAL) {
      if (diffs[pointer][1].length < diffEditCost && (post_ins || post_del)) {
        equalities[equalitiesLength++] = pointer;
        pre_ins = post_ins;
        pre_del = post_del;
        lastEquality = diffs[pointer][1];
      } else {
        equalitiesLength = 0;
        lastEquality = null;
      }
      post_ins = post_del = false;
    } else {
      let booleanCount = function(...args) {
        return args.filter(Boolean).length;
      };
      if (diffs[pointer][0] === DIFF_DELETE)
        post_del = true;
      else
        post_ins = true;
      if (lastEquality && (pre_ins && pre_del && post_ins && post_del || lastEquality.length < diffEditCost / 2 && booleanCount(pre_ins, pre_del, post_ins, post_del) === 3)) {
        diffs.splice(equalities[equalitiesLength - 1], 0, createDiff(DIFF_DELETE, lastEquality));
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;
        lastEquality = null;
        if (pre_ins && pre_del) {
          post_ins = post_del = true;
          equalitiesLength = 0;
        } else {
          equalitiesLength--;
          pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
          post_ins = post_del = false;
        }
        changes = true;
      }
    }
    pointer++;
  }
  if (changes)
    diffCleanupMerge(diffs);
}
function diffCleanupMerge(diffs) {
  diffs.push(createDiff(DIFF_EQUAL, ""));
  let pointer = 0;
  let count_delete = 0;
  let count_insert = 0;
  let text_delete = "";
  let text_insert = "";
  let commonlength;
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        if (count_delete + count_insert > 1) {
          if (count_delete !== 0 && count_insert !== 0) {
            commonlength = diffCommonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if (pointer - count_delete - count_insert > 0 && diffs[pointer - count_delete - count_insert - 1][0] === DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] += text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, createDiff(DIFF_EQUAL, text_insert.substring(0, commonlength)));
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            commonlength = diffCommonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length - commonlength);
              text_delete = text_delete.substring(0, text_delete.length - commonlength);
            }
          }
          pointer -= count_delete + count_insert;
          diffs.splice(pointer, count_delete + count_insert);
          if (text_delete.length) {
            diffs.splice(pointer, 0, createDiff(DIFF_DELETE, text_delete));
            pointer++;
          }
          if (text_insert.length) {
            diffs.splice(pointer, 0, createDiff(DIFF_INSERT, text_insert));
            pointer++;
          }
          pointer++;
        } else if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = "";
        text_insert = "";
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === "")
    diffs.pop();
  let changes = false;
  pointer = 1;
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] === DIFF_EQUAL && diffs[pointer + 1][0] === DIFF_EQUAL) {
      if (diffs[pointer][1].substring(diffs[pointer][1].length - diffs[pointer - 1][1].length) === diffs[pointer - 1][1]) {
        diffs[pointer][1] = diffs[pointer - 1][1] + diffs[pointer][1].substring(0, diffs[pointer][1].length - diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) === diffs[pointer + 1][1]) {
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] = diffs[pointer][1].substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  if (changes)
    diffCleanupMerge(diffs);
}
function diffXIndex(diffs, loc) {
  let chars1 = 0;
  let chars2 = 0;
  let last_chars1 = 0;
  let last_chars2 = 0;
  let x;
  for (x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {
      chars1 += diffs[x][1].length;
    }
    if (diffs[x][0] !== DIFF_DELETE) {
      chars2 += diffs[x][1].length;
    }
    if (chars1 > loc) {
      break;
    }
    last_chars1 = chars1;
    last_chars2 = chars2;
  }
  if (diffs.length !== x && diffs[x][0] === DIFF_DELETE)
    return last_chars2;
  return last_chars2 + (loc - last_chars1);
}
function diffPrettyHtml(diffs) {
  const html = [];
  const pattern_amp = /&/g;
  const pattern_lt = /</g;
  const pattern_gt = />/g;
  const pattern_para = /\n/g;
  for (let x = 0; x < diffs.length; x++) {
    const op = diffs[x][0];
    const data = diffs[x][1];
    const text = data.replace(pattern_amp, "&amp;").replace(pattern_lt, "&lt;").replace(pattern_gt, "&gt;").replace(pattern_para, "&para;<br>");
    switch (op) {
      case DIFF_INSERT:
        html[x] = `<ins style="background:#e6ffe6;">${text}</ins>`;
        break;
      case DIFF_DELETE:
        html[x] = `<del style="background:#ffe6e6;">${text}</del>`;
        break;
      case DIFF_EQUAL:
        html[x] = `<span>${text}</span>`;
        break;
    }
  }
  return html.join("");
}
function diffText1(diffs) {
  const text = [];
  for (let x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT)
      text[x] = diffs[x][1];
  }
  return text.join("");
}
function diffText2(diffs) {
  const text = [];
  for (let x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_DELETE)
      text[x] = diffs[x][1];
  }
  return text.join("");
}
function diffLevenshtein(diffs) {
  let levenshtein = 0;
  let insertions = 0;
  let deletions = 0;
  for (let x = 0; x < diffs.length; x++) {
    const op = diffs[x][0];
    const data = diffs[x][1];
    switch (op) {
      case DIFF_INSERT:
        insertions += data.length;
        break;
      case DIFF_DELETE:
        deletions += data.length;
        break;
      case DIFF_EQUAL:
        levenshtein += Math.max(insertions, deletions);
        insertions = 0;
        deletions = 0;
        break;
    }
  }
  levenshtein += Math.max(insertions, deletions);
  return levenshtein;
}
function diffToDelta(diffs) {
  const text = [];
  for (let x = 0; x < diffs.length; x++) {
    switch (diffs[x][0]) {
      case DIFF_INSERT:
        text[x] = `+${encodeURI(diffs[x][1])}`;
        break;
      case DIFF_DELETE:
        text[x] = `-${diffs[x][1].length}`;
        break;
      case DIFF_EQUAL:
        text[x] = `=${diffs[x][1].length}`;
        break;
    }
  }
  return text.join("	").replace(/%20/g, " ");
}
function diffFromDelta(text1, delta) {
  const diffs = [];
  let diffsLength = 0;
  let pointer = 0;
  const tokens = delta.split(/\t/g);
  for (let x = 0; x < tokens.length; x++) {
    const param = tokens[x].substring(1);
    switch (tokens[x].charAt(0)) {
      case "+":
        try {
          diffs[diffsLength++] = createDiff(DIFF_INSERT, decodeURI(param));
        } catch {
          throw new Error(`Illegal escape in diff_fromDelta: ${param}`);
        }
        break;
      case "-":
      // Fall through.
      case "=": {
        const n = Number.parseInt(param, 10);
        if (Number.isNaN(n) || n < 0)
          throw new Error(`Invalid number in diff_fromDelta: ${param}`);
        const text = text1.substring(pointer, pointer += n);
        if (tokens[x].charAt(0) === "=")
          diffs[diffsLength++] = createDiff(DIFF_EQUAL, text);
        else
          diffs[diffsLength++] = createDiff(DIFF_DELETE, text);
        break;
      }
      default:
        if (tokens[x])
          throw new Error(`Invalid diff operation in diff_fromDelta: ${tokens[x]}`);
    }
  }
  if (pointer !== text1.length)
    throw new Error(`Delta length (${pointer}) does not equal source text length (${text1.length}).`);
  return diffs;
}

function matchMain(text, pattern, loc, options) {
  if (text == null || pattern == null || loc == null)
    throw new Error("Null input. (match_main)");
  loc = Math.max(0, Math.min(loc, text.length));
  if (text === pattern) {
    return 0;
  } else if (!text.length) {
    return -1;
  } else if (text.substring(loc, loc + pattern.length) === pattern) {
    return loc;
  } else {
    return matchBitap(text, pattern, loc, options);
  }
}
function matchBitap(text, pattern, loc, options) {
  const resolved = resolveOptions(options);
  if (pattern.length > resolved.matchMaxBits)
    throw new Error("Pattern too long for this browser.");
  const s = matchAlphabet(pattern);
  function matchBitapScore(e, x) {
    const accuracy = e / pattern.length;
    const proximity = Math.abs(loc - x);
    if (!resolved.matchDistance) {
      return proximity ? 1 : accuracy;
    }
    return accuracy + proximity / resolved.matchDistance;
  }
  let score_threshold = resolved.matchThreshold;
  let best_loc = text.indexOf(pattern, loc);
  if (best_loc !== -1) {
    score_threshold = Math.min(matchBitapScore(0, best_loc), score_threshold);
    best_loc = text.lastIndexOf(pattern, loc + pattern.length);
    if (best_loc !== -1)
      score_threshold = Math.min(matchBitapScore(0, best_loc), score_threshold);
  }
  const matchmask = 1 << pattern.length - 1;
  best_loc = -1;
  let bin_min, bin_mid;
  let bin_max = pattern.length + text.length;
  let last_rd = [];
  for (let d = 0; d < pattern.length; d++) {
    bin_min = 0;
    bin_mid = bin_max;
    while (bin_min < bin_mid) {
      if (matchBitapScore(d, loc + bin_mid) <= score_threshold)
        bin_min = bin_mid;
      else
        bin_max = bin_mid;
      bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
    }
    bin_max = bin_mid;
    let start = Math.max(1, loc - bin_mid + 1);
    const finish = Math.min(loc + bin_mid, text.length) + pattern.length;
    const rd = new Array(finish + 2);
    rd[finish + 1] = (1 << d) - 1;
    for (let j = finish; j >= start; j--) {
      const charMatch = s[text.charAt(j - 1)];
      if (d === 0) {
        rd[j] = (rd[j + 1] << 1 | 1) & charMatch;
      } else {
        rd[j] = (rd[j + 1] << 1 | 1) & charMatch | ((last_rd[j + 1] | last_rd[j]) << 1 | 1) | last_rd[j + 1];
      }
      if (rd[j] & matchmask) {
        const score = matchBitapScore(d, j - 1);
        if (score <= score_threshold) {
          score_threshold = score;
          best_loc = j - 1;
          if (best_loc > loc) {
            start = Math.max(1, 2 * loc - best_loc);
          } else {
            break;
          }
        }
      }
    }
    if (matchBitapScore(d + 1, loc) > score_threshold)
      break;
    last_rd = rd;
  }
  return best_loc;
}
function matchAlphabet(pattern) {
  const s = {};
  for (let i = 0; i < pattern.length; i++)
    s[pattern.charAt(i)] = 0;
  for (let i = 0; i < pattern.length; i++)
    s[pattern.charAt(i)] |= 1 << pattern.length - i - 1;
  return s;
}

function patchAddContext(patch, text, options) {
  if (text.length === 0)
    return;
  if (patch.start2 === null)
    throw new Error("patch not initialized");
  const {
    matchMaxBits = defaultOptions.matchMaxBits,
    patchMargin = defaultOptions.patchMargin
  } = options;
  let pattern = text.substring(patch.start2, patch.start2 + patch.length1);
  let padding = 0;
  while (text.indexOf(pattern) !== text.lastIndexOf(pattern) && pattern.length < matchMaxBits - patchMargin - patchMargin) {
    padding += patchMargin;
    pattern = text.substring(patch.start2 - padding, patch.start2 + patch.length1 + padding);
  }
  padding += patchMargin;
  const prefix = text.substring(patch.start2 - padding, patch.start2);
  if (prefix)
    patch.diffs.unshift(createDiff(DIFF_EQUAL, prefix));
  const suffix = text.substring(patch.start2 + patch.length1, patch.start2 + patch.length1 + padding);
  if (suffix)
    patch.diffs.push(createDiff(DIFF_EQUAL, suffix));
  patch.start1 -= prefix.length;
  patch.start2 -= prefix.length;
  patch.length1 += prefix.length + suffix.length;
  patch.length2 += prefix.length + suffix.length;
}
function patchMake(a, opt_b, opt_c, options = {}) {
  const resolved = {
    ...defaultOptions,
    ...options
  };
  let text1, diffs;
  if (typeof a == "string" && typeof opt_b == "string" && typeof opt_c == "undefined") {
    text1 = a;
    diffs = diffMain(text1, opt_b, resolved, true);
    if (diffs.length > 2) {
      diffCleanupSemantic(diffs);
      diffCleanupEfficiency(diffs);
    }
  } else if (a && typeof a == "object" && typeof opt_b == "undefined" && typeof opt_c == "undefined") {
    diffs = /** @type {Diff[]} */
    a;
    text1 = diffText1(diffs);
  } else if (typeof a == "string" && opt_b && typeof opt_b == "object" && typeof opt_c == "undefined") {
    text1 = /** @type {string} */
    a;
    diffs = /** @type {Diff[]} */
    opt_b;
  } else if (typeof a == "string" && typeof opt_b == "string" && opt_c && typeof opt_c == "object") {
    text1 = /** @type {string} */
    a;
    diffs = /** @type {Diff[]} */
    opt_c;
  } else {
    throw new Error("Unknown call format to patch_make.");
  }
  if (diffs.length === 0)
    return [];
  const patches = [];
  let patch = createPatch();
  let patchDiffLength = 0;
  let char_count1 = 0;
  let char_count2 = 0;
  let prepatch_text = text1;
  let postpatch_text = text1;
  for (let x = 0; x < diffs.length; x++) {
    const diff_type = diffs[x][0];
    const diff_text = diffs[x][1];
    if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
      patch.start1 = char_count1;
      patch.start2 = char_count2;
    }
    switch (diff_type) {
      case DIFF_INSERT:
        patch.diffs[patchDiffLength++] = diffs[x];
        patch.length2 += diff_text.length;
        postpatch_text = postpatch_text.substring(0, char_count2) + diff_text + postpatch_text.substring(char_count2);
        break;
      case DIFF_DELETE:
        patch.length1 += diff_text.length;
        patch.diffs[patchDiffLength++] = diffs[x];
        postpatch_text = postpatch_text.substring(0, char_count2) + postpatch_text.substring(char_count2 + diff_text.length);
        break;
      case DIFF_EQUAL:
        if (diff_text.length <= 2 * resolved.patchMargin && patchDiffLength && diffs.length !== x + 1) {
          patch.diffs[patchDiffLength++] = diffs[x];
          patch.length1 += diff_text.length;
          patch.length2 += diff_text.length;
        } else if (diff_text.length >= 2 * resolved.patchMargin) {
          if (patchDiffLength) {
            patchAddContext(patch, prepatch_text, resolved);
            patches.push(patch);
            patch = createPatch();
            patchDiffLength = 0;
            prepatch_text = postpatch_text;
            char_count1 = char_count2;
          }
        }
        break;
    }
    if (diff_type !== DIFF_INSERT)
      char_count1 += diff_text.length;
    if (diff_type !== DIFF_DELETE)
      char_count2 += diff_text.length;
  }
  if (patchDiffLength) {
    patchAddContext(patch, prepatch_text, resolved);
    patches.push(patch);
  }
  return patches;
}
function patchDeepCopy(patches) {
  const patchesCopy = [];
  for (let x = 0; x < patches.length; x++) {
    const patch = patches[x];
    const patchCopy = createPatch();
    patchCopy.diffs = [];
    for (let y = 0; y < patch.diffs.length; y++) {
      patchCopy.diffs[y] = createDiff(patch.diffs[y][0], patch.diffs[y][1]);
    }
    patchCopy.start1 = patch.start1;
    patchCopy.start2 = patch.start2;
    patchCopy.length1 = patch.length1;
    patchCopy.length2 = patch.length2;
    patchesCopy[x] = patchCopy;
  }
  return patchesCopy;
}
function patchApply(patches, text, options) {
  if (patches.length === 0)
    return [text, []];
  patches = patchDeepCopy(patches);
  const resolved = resolveOptions(options);
  const nullPadding = patchAddPadding(patches, resolved);
  text = nullPadding + text + nullPadding;
  patchSplitMax(patches, resolved);
  let delta = 0;
  const results = [];
  for (let x = 0; x < patches.length; x++) {
    const expected_loc = patches[x].start2 + delta;
    const text1 = diffText1(patches[x].diffs);
    let start_loc;
    let end_loc = -1;
    if (text1.length > resolved.matchMaxBits) {
      start_loc = matchMain(
        text,
        text1.substring(0, resolved.matchMaxBits),
        expected_loc,
        options
      );
      if (start_loc !== -1) {
        end_loc = matchMain(
          text,
          text1.substring(text1.length - resolved.matchMaxBits),
          expected_loc + text1.length - resolved.matchMaxBits,
          options
        );
        if (end_loc === -1 || start_loc >= end_loc) {
          start_loc = -1;
        }
      }
    } else {
      start_loc = matchMain(text, text1, expected_loc, options);
    }
    if (start_loc === -1) {
      results[x] = false;
      delta -= patches[x].length2 - patches[x].length1;
    } else {
      results[x] = true;
      delta = start_loc - expected_loc;
      let text2;
      if (end_loc === -1)
        text2 = text.substring(start_loc, start_loc + text1.length);
      else
        text2 = text.substring(start_loc, end_loc + resolved.matchMaxBits);
      if (text1 === text2) {
        text = text.substring(0, start_loc) + diffText2(patches[x].diffs) + text.substring(start_loc + text1.length);
      } else {
        const diffs = diffMain(text1, text2, options, false);
        if (text1.length > resolved.matchMaxBits && diffLevenshtein(diffs) / text1.length > resolved.patchDeleteThreshold) {
          results[x] = false;
        } else {
          diffCleanupSemanticLossless(diffs);
          let index1 = 0;
          let index2 = 0;
          for (let y = 0; y < patches[x].diffs.length; y++) {
            const mod = patches[x].diffs[y];
            if (mod[0] !== DIFF_EQUAL)
              index2 = diffXIndex(diffs, index1);
            if (mod[0] === DIFF_INSERT) {
              text = text.substring(0, start_loc + index2) + mod[1] + text.substring(start_loc + index2);
            } else if (mod[0] === DIFF_DELETE) {
              text = text.substring(0, start_loc + index2) + text.substring(start_loc + diffXIndex(diffs, index1 + mod[1].length));
            }
            if (mod[0] !== DIFF_DELETE)
              index1 += mod[1].length;
          }
        }
      }
    }
  }
  text = text.substring(nullPadding.length, text.length - nullPadding.length);
  return [text, results];
}
function patchAddPadding(patches, options = {}) {
  const {
    patchMargin: paddingLength = defaultOptions.patchMargin
  } = options;
  let nullPadding = "";
  for (let x = 1; x <= paddingLength; x++)
    nullPadding += String.fromCharCode(x);
  for (let x = 0; x < patches.length; x++) {
    patches[x].start1 += paddingLength;
    patches[x].start2 += paddingLength;
  }
  let patch = patches[0];
  let diffs = patch.diffs;
  if (diffs.length === 0 || diffs[0][0] !== DIFF_EQUAL) {
    diffs.unshift(createDiff(DIFF_EQUAL, nullPadding));
    patch.start1 -= paddingLength;
    patch.start2 -= paddingLength;
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[0][1].length) {
    const extraLength = paddingLength - diffs[0][1].length;
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
    patch.start1 -= extraLength;
    patch.start2 -= extraLength;
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }
  patch = patches[patches.length - 1];
  diffs = patch.diffs;
  if (diffs.length === 0 || diffs[diffs.length - 1][0] !== DIFF_EQUAL) {
    diffs.push(createDiff(DIFF_EQUAL, nullPadding));
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[diffs.length - 1][1].length) {
    const extraLength = paddingLength - diffs[diffs.length - 1][1].length;
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }
  return nullPadding;
}
function patchSplitMax(patches, options) {
  const resolved = resolveOptions(options);
  for (let x = 0; x < patches.length; x++) {
    if (patches[x].length1 <= resolved.matchMaxBits)
      continue;
    const bigpatch = patches[x];
    patches.splice(x--, 1);
    let start1 = bigpatch.start1;
    let start2 = bigpatch.start2;
    let precontext = "";
    while (bigpatch.diffs.length !== 0) {
      const patch = createPatch();
      let empty = true;
      patch.start1 = start1 - precontext.length;
      patch.start2 = start2 - precontext.length;
      if (precontext !== "") {
        patch.length1 = patch.length2 = precontext.length;
        patch.diffs.push(createDiff(DIFF_EQUAL, precontext));
      }
      while (bigpatch.diffs.length !== 0 && patch.length1 < resolved.matchMaxBits - resolved.patchMargin) {
        const diff_type = bigpatch.diffs[0][0];
        let diff_text = bigpatch.diffs[0][1];
        if (diff_type === DIFF_INSERT) {
          patch.length2 += diff_text.length;
          start2 += diff_text.length;
          patch.diffs.push(bigpatch.diffs.shift());
          empty = false;
        } else if (diff_type === DIFF_DELETE && patch.diffs.length === 1 && patch.diffs[0][0] === DIFF_EQUAL && diff_text.length > 2 * resolved.matchMaxBits) {
          patch.length1 += diff_text.length;
          start1 += diff_text.length;
          empty = false;
          patch.diffs.push(createDiff(diff_type, diff_text));
          bigpatch.diffs.shift();
        } else {
          diff_text = diff_text.substring(0, resolved.matchMaxBits - patch.length1 - resolved.patchMargin);
          patch.length1 += diff_text.length;
          start1 += diff_text.length;
          if (diff_type === DIFF_EQUAL) {
            patch.length2 += diff_text.length;
            start2 += diff_text.length;
          } else {
            empty = false;
          }
          patch.diffs.push(createDiff(diff_type, diff_text));
          if (diff_text === bigpatch.diffs[0][1]) {
            bigpatch.diffs.shift();
          } else {
            bigpatch.diffs[0][1] = bigpatch.diffs[0][1].substring(diff_text.length);
          }
        }
      }
      precontext = diffText2(patch.diffs);
      precontext = precontext.substring(precontext.length - resolved.patchMargin);
      const postcontext = diffText1(bigpatch.diffs).substring(0, resolved.patchMargin);
      if (postcontext !== "") {
        patch.length1 += postcontext.length;
        patch.length2 += postcontext.length;
        if (patch.diffs.length !== 0 && patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
          patch.diffs[patch.diffs.length - 1][1] += postcontext;
        } else {
          patch.diffs.push(createDiff(DIFF_EQUAL, postcontext));
        }
      }
      if (!empty)
        patches.splice(++x, 0, patch);
    }
  }
}
function patchToText(patches) {
  const text = [];
  for (let x = 0; x < patches.length; x++)
    text[x] = patches[x];
  return text.join("");
}
function patchFromText(textline) {
  const patches = [];
  if (!textline)
    return patches;
  const text = textline.split("\n");
  let textPointer = 0;
  const patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
  while (textPointer < text.length) {
    const m = text[textPointer].match(patchHeader);
    if (!m)
      throw new Error(`Invalid patch string: ${text[textPointer]}`);
    const patch = createPatch();
    patches.push(patch);
    patch.start1 = Number.parseInt(m[1], 10);
    if (m[2] === "") {
      patch.start1--;
      patch.length1 = 1;
    } else if (m[2] === "0") {
      patch.length1 = 0;
    } else {
      patch.start1--;
      patch.length1 = Number.parseInt(m[2], 10);
    }
    patch.start2 = Number.parseInt(m[3], 10);
    if (m[4] === "") {
      patch.start2--;
      patch.length2 = 1;
    } else if (m[4] === "0") {
      patch.length2 = 0;
    } else {
      patch.start2--;
      patch.length2 = Number.parseInt(m[4], 10);
    }
    textPointer++;
    while (textPointer < text.length) {
      const sign = text[textPointer].charAt(0);
      let line = "";
      try {
        line = decodeURI(text[textPointer].substring(1));
      } catch {
        throw new Error(`Illegal escape in patch_fromText: ${line}`);
      }
      if (sign === "-") {
        patch.diffs.push(createDiff(DIFF_DELETE, line));
      } else if (sign === "+") {
        patch.diffs.push(createDiff(DIFF_INSERT, line));
      } else if (sign === " ") {
        patch.diffs.push(createDiff(DIFF_EQUAL, line));
      } else if (sign === "@") {
        break;
      } else if (sign === "") ; else {
        throw new Error(`Invalid patch mode "${sign}" in: ${line}`);
      }
      textPointer++;
    }
  }
  return patches;
}
function createPatch() {
  const patch = {
    diffs: [],
    start1: null,
    start2: null,
    length1: 0,
    length2: 0
  };
  patch.toString = function() {
    let coords1, coords2;
    if (this.length1 === 0)
      coords1 = `${this.start1},0`;
    else if (this.length1 === 1)
      coords1 = this.start1 + 1;
    else
      coords1 = `${this.start1 + 1},${this.length1}`;
    if (this.length2 === 0)
      coords2 = `${this.start2},0`;
    else if (this.length2 === 1)
      coords2 = this.start2 + 1;
    else
      coords2 = `${this.start2 + 1},${this.length2}`;
    const text = [`@@ -${coords1} +${coords2} @@
`];
    let op;
    for (let x = 0; x < this.diffs.length; x++) {
      switch (this.diffs[x][0]) {
        case DIFF_INSERT:
          op = "+";
          break;
        case DIFF_DELETE:
          op = "-";
          break;
        case DIFF_EQUAL:
          op = " ";
          break;
      }
      text[x + 1] = `${op + encodeURI(this.diffs[x][1])}
`;
    }
    return text.join("").replace(/%20/g, " ");
  };
  return patch;
}

exports.DIFF_DELETE = DIFF_DELETE;
exports.DIFF_EQUAL = DIFF_EQUAL;
exports.DIFF_INSERT = DIFF_INSERT;
exports.defaultOptions = defaultOptions;
exports.diff = diffMain;
exports.diffCharsToLines = diffCharsToLines;
exports.diffCleanupEfficiency = diffCleanupEfficiency;
exports.diffCleanupMerge = diffCleanupMerge;
exports.diffCleanupSemantic = diffCleanupSemantic;
exports.diffCleanupSemanticLossless = diffCleanupSemanticLossless;
exports.diffCommonPrefix = diffCommonPrefix;
exports.diffCommonSuffix = diffCommonSuffix;
exports.diffFromDelta = diffFromDelta;
exports.diffLevenshtein = diffLevenshtein;
exports.diffLinesToChars = diffLinesToChars;
exports.diffMain = diffMain;
exports.diffPrettyHtml = diffPrettyHtml;
exports.diffText1 = diffText1;
exports.diffText2 = diffText2;
exports.diffToDelta = diffToDelta;
exports.diffXIndex = diffXIndex;
exports.match = matchMain;
exports.matchAlphabet = matchAlphabet;
exports.matchBitap = matchBitap;
exports.matchMain = matchMain;
exports.patch = patchMake;
exports.patchAddPadding = patchAddPadding;
exports.patchApply = patchApply;
exports.patchDeepCopy = patchDeepCopy;
exports.patchFromText = patchFromText;
exports.patchMake = patchMake;
exports.patchSplitMax = patchSplitMax;
exports.patchToText = patchToText;
exports.resolveOptions = resolveOptions;
