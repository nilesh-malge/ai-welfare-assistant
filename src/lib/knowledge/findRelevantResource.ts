import {
  knowledgeBase,
  type KnowledgeItem,
} from "@/lib/knowledge/knowledgeBase";

import type { TriageResult } from "@/lib/ai/triageSchema";

type ResourceMatch = {
  item: KnowledgeItem;
  keywordMatches: number;
  categoryMatch: boolean;
  score: number;
};

function containsKeyword(message: string, keyword: string): boolean {
  const normalizedMessage = message.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();

  const escapedKeyword = normalizedKeyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`,
    "i",
  );

  return pattern.test(normalizedMessage);
}

export function findRelevantResource(
  message: string,
  triage: TriageResult,
): KnowledgeItem | null {
  const matches: ResourceMatch[] = knowledgeBase
    .map((item) => {
      const keywordMatches = item.keywords.filter((keyword) =>
        containsKeyword(message, keyword),
      ).length;

      const categoryMatch = item.category === triage.category;

      /*
       * Keyword evidence is the main signal.
       * Matching the triage category gives a small
       * additional preference when multiple resources
       * have similar keyword matches.
       */
      const score = keywordMatches * 2 + (categoryMatch ? 1 : 0);

      return {
        item,
        keywordMatches,
        categoryMatch,
        score,
      };
    })
    .filter((match) => match.keywordMatches > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.keywordMatches !== a.keywordMatches) {
        return b.keywordMatches - a.keywordMatches;
      }

      if (a.categoryMatch !== b.categoryMatch) {
        return a.categoryMatch ? -1 : 1;
      }

      return 0;
    });

  const bestMatch = matches[0] ?? null;

  if (!bestMatch) {
    console.warn(
      `[knowledge] No resource found for category="${triage.category}" message="${message}"`,
    );

    return null;
  }

  return bestMatch.item;
}
