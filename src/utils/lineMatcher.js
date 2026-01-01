import * as Diff from 'diff';

/**
 * Calculate similarity score between two strings using character-level diff
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const charDiff = Diff.diffChars(str1, str2);
  let commonChars = 0;
  let totalChars = 0;

  charDiff.forEach(part => {
    const len = part.value.length;
    totalChars += len;
    if (!part.added && !part.removed) {
      commonChars += len;
    }
  });

  return totalChars > 0 ? commonChars / totalChars : 0;
}

/**
 * Find best matching pairs between removed and added lines
 * Uses greedy matching based on similarity scores
 */
function findBestMatches(removedLines, addedLines) {
  const matches = [];
  const usedRemoved = new Set();
  const usedAdded = new Set();

  // Calculate all similarity scores
  const scores = [];
  for (let i = 0; i < removedLines.length; i++) {
    for (let j = 0; j < addedLines.length; j++) {
      const similarity = calculateSimilarity(removedLines[i], addedLines[j]);
      scores.push({ removedIdx: i, addedIdx: j, similarity });
    }
  }

  // Sort by similarity (highest first)
  scores.sort((a, b) => b.similarity - a.similarity);

  // Greedily select best matches
  for (const score of scores) {
    if (!usedRemoved.has(score.removedIdx) && !usedAdded.has(score.addedIdx)) {
      // Only consider pairs with reasonable similarity (> 0.3)
      if (score.similarity > 0.3) {
        matches.push({
          removedIdx: score.removedIdx,
          addedIdx: score.addedIdx,
          similarity: score.similarity
        });
        usedRemoved.add(score.removedIdx);
        usedAdded.add(score.addedIdx);
      }
    }
  }

  return { matches, usedRemoved, usedAdded };
}

/**
 * Match removed and added lines intelligently
 * Treats the smaller set as a whole and finds best matches with the larger set
 * Returns processed diff items with modified, removed, and added types
 */
export function matchLines(removedLines, addedLines) {
  const result = [];

  if (removedLines.length === 0) {
    // Only additions
    addedLines.forEach(line => {
      result.push({ type: 'added', line });
    });
    return result;
  }

  if (addedLines.length === 0) {
    // Only removals
    removedLines.forEach(line => {
      result.push({ type: 'removed', line });
    });
    return result;
  }

  // Find best matches
  const { matches, usedRemoved, usedAdded } = findBestMatches(removedLines, addedLines);

  // Sort matches by the order they appear in the original arrays
  // Prioritize removed index for ordering
  matches.sort((a, b) => {
    if (a.removedIdx !== b.removedIdx) {
      return a.removedIdx - b.removedIdx;
    }
    return a.addedIdx - b.addedIdx;
  });

  // Track which indices we've already processed
  let removedIdx = 0;
  let addedIdx = 0;

  // Process matches in order
  for (const match of matches) {
    // Add any unmatched removed lines before this match
    while (removedIdx < match.removedIdx) {
      if (!usedRemoved.has(removedIdx)) {
        result.push({ type: 'removed', line: removedLines[removedIdx] });
      } else {
        removedIdx++;
        continue;
      }
      removedIdx++;
    }

    // Add any unmatched added lines before this match
    while (addedIdx < match.addedIdx) {
      if (!usedAdded.has(addedIdx)) {
        result.push({ type: 'added', line: addedLines[addedIdx] });
      } else {
        addedIdx++;
        continue;
      }
      addedIdx++;
    }

    // Add the matched pair as modified
    result.push({
      type: 'modified',
      removed: removedLines[match.removedIdx],
      added: addedLines[match.addedIdx]
    });

    removedIdx = match.removedIdx + 1;
    addedIdx = match.addedIdx + 1;
  }

  // Add remaining unmatched removed lines
  for (let i = removedIdx; i < removedLines.length; i++) {
    if (!usedRemoved.has(i)) {
      result.push({ type: 'removed', line: removedLines[i] });
    }
  }

  // Add remaining unmatched added lines
  for (let i = addedIdx; i < addedLines.length; i++) {
    if (!usedAdded.has(i)) {
      result.push({ type: 'added', line: addedLines[i] });
    }
  }

  return result;
}
