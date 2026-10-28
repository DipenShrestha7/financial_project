const NEWS_FEED_URL =
  "https://huggingface.co/datasets/thegauravgiri/nepali-news-dataset/resolve/main/data/today.json";

export type NewsArticle = {
  title: string;
  summary: string;
  source: string;
  language?: string;
  source_url: string;
  image_url?: string;
};

type NewsFeed = {
  scraped_at?: string;
  date?: string;
  sources?: string[];
  articles?: NewsArticle[];
};

const bankTerms = [
  "commercial bank",
  "development bank",
  "finance company",
  "bank",
  "banking",
  "finance",
  "financial",
  "nepal rastra bank",
  "central bank",
  "interest rate",
  "deposit",
  "loan",
  "credit",
  "foreign exchange",
  "currency",
  "राष्ट्र बैंक",
  "बैंक",
  "बैंकिङ",
  "वित्त",
  "मौद्रिक",
  "ब्याज",
  "निक्षेप",
  "कर्जा",
  "मुद्रा",
  "विनिमय दर",
];

const nepseTerms = [
  "शेयर",
  "सेयर",
  "share market",
  "stock",
  "nepse",
  "ipo",
  "fpo",
  "dividend",
  "bonus share",
  "capital market",
  "धितोपत्र",
  "पूँजी बजार",
  "लाभांश",
  "बोनस",
  "सूचकांक",
];

export type NewsCategory = "Banks" | "NEPSE";

function matchingTerms(text: string, terms: string[]) {
  return terms.filter((term) =>
    term.includes(" ") ||
    term.split("").some((character) => character.charCodeAt(0) > 127)
      ? text.includes(term)
      : new RegExp(`\\b${term}\\b`).test(text),
  );
}

export function getNewsCategory(article: NewsArticle): NewsCategory | null {
  const title = article.title.toLocaleLowerCase();
  const summary = article.summary.toLocaleLowerCase();
  const text = `${title} ${summary}`;
  const titleNepse = matchingTerms(title, nepseTerms);
  const titleBanks = matchingTerms(title, bankTerms);
  const bodyNepse = matchingTerms(text, nepseTerms);
  const bodyBanks = matchingTerms(text, bankTerms);

  if (titleNepse.length > 0) return "NEPSE";
  if (titleBanks.length > 0) return "Banks";

  // Summaries can contain the useful detail, but require two signals so
  // generic words such as "loan" or "stock" do not classify unrelated news.
  if (bodyNepse.length >= 2) return "NEPSE";
  if (bodyBanks.length >= 2) return "Banks";

  return null;
}

export async function fetchNepalFinanceNews() {
  const response = await fetch(NEWS_FEED_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`News feed returned ${response.status}`);
  }

  const feed = (await response.json()) as NewsFeed;
  const articles = (feed.articles ?? [])
    .filter(
      (article) =>
        article.title &&
        article.summary &&
        article.source_url &&
        getNewsCategory(article) !== null,
    )
    .slice(0, 40);

  return {
    articles,
    date: feed.date,
    scrapedAt: feed.scraped_at,
    sources: feed.sources ?? [],
  };
}
