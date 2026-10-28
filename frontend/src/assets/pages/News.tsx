import {
  Building2,
  Clock3,
  ExternalLink,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  fetchNepalFinanceNews,
  getNewsCategory,
  type NewsArticle,
  type NewsCategory,
} from "../services/news";

const categoryOptions: Array<"All" | NewsCategory> = [
  "All",
  "Banks",
  "NEPSE",
];

function formatDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-NP", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function NewsCard({ article }: { article: NewsArticle }) {
  const category = getNewsCategory(article);
  const excerpt = article.summary.replace(/\s+/g, " ").trim();

  return (
    <article className="group overflow-hidden rounded-lg border border-[#1d3937] bg-[#0b1112] transition hover:border-[#2c665d]">
      {article.image_url && (
        <img
          src={article.image_url}
          alt=""
          className="h-36 w-full object-cover opacity-80 transition group-hover:opacity-100"
          loading="lazy"
        />
      )}
      <div className="p-4.5">
        <div className="mb-3 flex items-center justify-between gap-3 text-[9px]">
          <span
            className={`rounded-full px-2 py-1 ${category === "Banks" ? "bg-[#16313b] text-[#8dc1e0]" : "bg-[#302612] text-[#e2bd67]"}`}
          >
            {category}
          </span>
          <span className="truncate text-[#697b7b]">{article.source}</span>
        </div>
        <h2 className="line-clamp-3 text-[14px] font-semibold leading-5 text-[#e9f1ef]">
          {article.title}
        </h2>
        <p className="mt-2.5 line-clamp-3 text-[11px] leading-5 text-[#81908f]">
          {excerpt}
        </p>
        <a
          href={article.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#55d4b8] hover:text-[#9af2dd]"
        >
          Read full story <ExternalLink size={12} />
        </a>
      </div>
    </article>
  );
}

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [feedDate, setFeedDate] = useState<string>();
  const [scrapedAt, setScrapedAt] = useState<string>();
  const [sources, setSources] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"All" | NewsCategory>(
    "All",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const feed = await fetchNepalFinanceNews();
      setArticles(feed.articles);
      setFeedDate(feed.date);
      setScrapedAt(feed.scrapedAt);
      setSources(feed.sources);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The news feed could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNews();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNews]);

  const visibleArticles = useMemo(
    () =>
      selectedCategory === "All"
        ? articles
        : articles.filter((article) => getNewsCategory(article) === selectedCategory),
    [articles, selectedCategory],
  );

  return (
    <Sidebar activePage="news" breadcrumb="News">
      <div className="mx-auto max-w-330 p-10.5 max-[900px]:px-6 max-[680px]:px-4.25 max-[680px]:py-7">
        <div className="mb-7 flex items-end justify-between gap-4 max-[680px]:flex-col max-[680px]:items-start">
          <div>
            <p className="mb-2.25 text-[9px] font-bold uppercase tracking-[1.3px] text-[#5d6b6d]">
              Nepal financial desk
            </p>
            <h1 className="mb-1.75 text-[29px] font-bold tracking-[-1px] text-[#f1f4f3] max-[680px]:text-[25px]">
              Banks & NEPSE news
            </h1>
            <p className="text-[12px] text-[#758183]">
              Relevant headlines from Nepal, with a direct link to every
              publisher story.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadNews()}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-[#2a4442] bg-[#10211f] px-3.75 py-2.75 text-[10px] font-semibold text-[#70d9bf] hover:bg-[#15312d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh feed
          </button>
        </div>

        <section className="mb-5 grid grid-cols-3 gap-3.5 max-[680px]:grid-cols-1">
          <NewsStat icon={Building2} label="Bank stories" value={String(articles.filter((a) => getNewsCategory(a) === "Banks").length)} />
          <NewsStat icon={TrendingUp} label="NEPSE stories" value={String(articles.filter((a) => getNewsCategory(a) === "NEPSE").length)} />
          <NewsStat icon={Clock3} label="Feed date" value={feedDate ?? "—"} />
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1.75 text-[10px] ${selectedCategory === category ? "bg-[#32c7aa] font-semibold text-[#041311]" : "border border-[#243735] text-[#8aa09e] hover:border-[#3e7067] hover:text-[#d4e4e0]"}`}
            >
              {category}
            </button>
          ))}
          <span className="ml-auto text-[9px] text-[#627271]">
            {scrapedAt ? `Updated ${formatDate(scrapedAt)}` : "Checking feed…"}
          </span>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-[#693c38] bg-[#251617] p-4 text-[11px] text-[#ecaaa0]">
            Unable to load the latest feed. {error}{" "}
            <button className="font-semibold underline" onClick={() => void loadNews()}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-[#1d3937] bg-[#0b1112] p-8 text-center text-[11px] text-[#748684]">
            Loading Nepal financial news…
          </div>
        ) : visibleArticles.length > 0 ? (
          <div className="grid grid-cols-3 gap-3.5 max-[1000px]:grid-cols-2 max-[680px]:grid-cols-1">
            {visibleArticles.map((article, index) => (
              <NewsCard key={`${article.source_url}-${index}`} article={article} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-[#1d3937] bg-[#0b1112] p-8 text-center text-[11px] text-[#748684]">
            No {selectedCategory === "All" ? "bank or NEPSE" : selectedCategory} stories are available in the current feed.
          </div>
        )}

        <p className="mt-5 text-[9px] leading-4 text-[#617170]">
          Feed sources: {sources.length > 0 ? sources.join(", ") : "the public Nepal news feed"}.
          Headlines and summaries are provided by the original publishers. Open a story to read the complete article.
        </p>
      </div>
    </Sidebar>
  );
}

function NewsStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-[#203034] bg-[#0b1112] p-4.5">
      <div className="flex items-center gap-2 text-[10px] text-[#aab6b6]">
        <Icon size={14} className="text-[#55d4b8]" />
        {label}
      </div>
      <strong className="mt-3 block truncate text-[18px] font-semibold text-[#eff4f2]">
        {value}
      </strong>
    </article>
  );
}
