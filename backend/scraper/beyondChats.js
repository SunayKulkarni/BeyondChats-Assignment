import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapePage(url) {

    const response  = await axios.get(url);

    const $  = cheerio.load(response.data);
    const articles = [];

    $("article.entry-card").each((_, el) => {
    const title = $(el).find("h2.entry-title a").first().text().trim();

    const link = $(el).find("h2.entry-title a").first().attr("href");

    const dateText = $(el).find("time.ct-meta-element-date").first().text().trim();

    if (title && link && dateText) {

      articles.push({
        title,
        url: link.startsWith("http")
          ? link
          : `https://beyondchats.com${link}`,
        publishedAt: new Date(dateText)
      });

    }
  });
    return articles;
}



async function main() {
  const page14 = await scrapePage(
    "https://beyondchats.com/blogs/page/14/"
  );

  const page15 = await scrapePage(
    "https://beyondchats.com/blogs/page/15/"
  );

  const allArticles = [...page14, ...page15];

  const uniqueArticles = Array.from(
    new Map(allArticles.map(a => [a.url, a])).values()
  );

  const oldestFive = [...uniqueArticles]
    .sort((a, b) => a.publishedAt - b.publishedAt)
    .slice(0, 5);

  console.log("\nOldest 5 articles:\n");

  oldestFive.forEach((a, i) => {
    console.log(`${i + 1}. ${a.title}`);
    console.log(a.url);
    console.log("Published:", a.publishedAt.toDateString());
    console.log("-----------");
  });
}

main();