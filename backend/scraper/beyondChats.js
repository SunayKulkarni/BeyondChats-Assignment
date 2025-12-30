import axios from 'axios';
import * as cheerio from 'cheerio';
import Article from '../models/articleModel.js';
import mongoose, { connect } from 'mongoose';
import { connectDB } from '../db/db.js';

async function scrapePage(url) {

    const response  = await axios.get(url);

    const $  = cheerio.load(response.data);
    const articles = [];

    $("article.entry-card").each((_, el) => {
    const title = $(el).find("h2.entry-title a").first().text().trim();

    const link = $(el).find("h2.entry-title a").first().attr("href");

    const dateText = $(el).find("time.ct-meta-element-date").first().text().trim();

    const content = $(el).find("div.entry-content").first().text().trim();

    if (title && link && dateText) {

      articles.push({
        title,
        url: link.startsWith("http")
          ? link
          : `https://beyondchats.com${link}`,
        publishedAt: new Date(dateText),
        content,
      });

    }
  });
    return articles;
}



async function scrapeArticleContent(url){

  const response = await axios.get(url);
  
  const $ = cheerio.load(response.data);

  const title = $("h1").text().trim();

  const content  = $("div.elementor-widget-theme-post-content").text().replace(/\s+/g, ' ').trim();

  return { title, content };
      
}



async function saveArticle(articles){
    try{
      await Article.updateOne(
        { url: articles.url },
        { $set: articles },
        { upsert: true }
      );
      console.log(`Saved/Updated article: ${articles.title}`);
    } catch (error) {
      console.error("Error saving article:", error);
    }
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


  const article  = await scrapeArticleContent(oldestFive[0].url);
  
  console.log("\nContent of the oldest article:\n");
  console.log("Title:", article.title);
  console.log("Content:", article.content.substring(0, 500) + "...");


  for(const articles of oldestFive){
    const fullArticle = await scrapeArticleContent(articles.url);
    const articleToSave = {
      title: fullArticle.title,
      url: articles.url,
      publishedAt: articles.publishedAt,
      content: fullArticle.content,
    };
    await saveArticle(articleToSave);
  }
}


async function run() {
  await connectDB();
  await main();
  process.exit(0);
}

run();