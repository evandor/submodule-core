// @ts-ignore
import {convert} from "html-to-text"
import * as cheerio from 'cheerio';

class ContentUtils {


  private isRelative(href: string | undefined) {
    if (!href) {
      return true
    }
    return !(href.startsWith("http://") || href.startsWith("https://") || href.startsWith("chrome-extension://"))
  }


  html2tokens(html: string): Set<any> {
    //console.log("got html", html)
    const text = convert(html, {
      wordwrap: 130
    });
    //console.log("got text", text)
    const text2 = text.replace(/\[[^\]].*/g, '').replaceAll('*', '')
    //console.log("got text2", text2)
    const tokens = text2
      .replaceAll("\\n", " ")
      .replaceAll("[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}", " ")
      .replaceAll("[\u00AD\u002D\u2011]", ' ')
      .replaceAll("\n", " ")
      .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>»«{}\[\]\\\/]/gi, ' ')
      .split(" ")
    // console.log("got token", tokens)
    let res = ""
    const tokenSet = new Set()
    tokens.forEach((t: string) => {
      if (t.length >= 4 && t.length <= 24) {
        res += t + " "
        tokenSet.add(t.toLowerCase())
      }
    })
    // console.log("got token2", tokenSet)
    return tokenSet
  }


  async imageUrlToBase64(url: string) {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        resolve(base64data);
      };
      reader.onerror = reject;
    });
  };

  async processHtml(tabUrl: string, html: string) {
    try {
      let url = new URL(tabUrl)
      // const htmlWithBaseRef = await this.setBaseHref(url, html)
      const $ = cheerio.load(html);
      await this.inlineImages(url, $)
      await this.inlineScripts(url, $)
      //await this.inlineCSS(url, $)


      // const overlayScript = converted.window.document.createElement('script')
      // overlayScript.onload = function() {
      //   alert("Script loaded and ready");
      // };
      // //overlayScript.src = "chrome-extension://pndffocijjfpmphlhkoijmpfckjafdpl/www/js/my-content-script.js";
      //
      // overlayScript.type = 'text/javascript';
      // var code = 'console.log("script insert");';
      // try { // doesn't work on ie...
      //   overlayScript.appendChild(document.createTextNode(code));
      // } catch(e) { // IE has funky script nodes
      //   overlayScript.text = code;
      // }

      // $('<script>alert("done")</script>').appendTo('body');


      return $.html()
    } catch (err) {
      console.error(err);
      return "could not process due to " + err
    }
  }

  async inlineImages(url: URL, $: cheerio.CheerioAPI) {
    for (const elem of $('img')) {
      const src = $(elem).attr("src")
      if (src && !src.startsWith("chrome-extension://")) { // && isRelative(src)) {
        console.log("checking1: ", src, this.isRelative(src))
        const absoluteUrl = `${url.protocol}//${url.hostname}/${src}`
        console.log("checking2: ", absoluteUrl)
        const base64rep = await this.imageUrlToBase64(absoluteUrl) as string
        $(elem).attr("src", base64rep);
      }
    }
  }

  async inlineScripts(url: URL, $: cheerio.CheerioAPI) {
    for (const elem of $('script')) {
      const src = $(elem).attr("src")
      if (src && !src.startsWith("chrome-extension://")) {  // && isRelative(src)) {
        console.log("checking1: ", src, this.isRelative(src))
        const absoluteUrl = `${url.protocol}//${url.hostname}/${src}`
        console.log("checking2: ", absoluteUrl)
        try {
          const script = await fetch(absoluteUrl)
          // console.log("data", script.status)
          if (script.status !== 404) {
            const s = await script.text()
            //const base64rep = await this.imageUrlToBase64(absoluteUrl) as string
            $(elem).removeAttr("src")
            $(elem).text(s)
          }
        } catch (err: any) {
          console.log("err", err)
        }
      }
    }
  }

  async inlineCSS(url: URL, $: cheerio.CheerioAPI) {
    for (const elem of $('link')) {
      const rel = $(elem).attr("rel")
      if (!rel || rel !== "stylesheet") {
        continue
      }
      const href = $(elem).attr("href")
      if (href) { // && isRelative(src)) {
        const absoluteUrl = `${url.protocol}//${url.hostname}/${href}`
        try {
          const script = await fetch(absoluteUrl)
          console.log("data", script.status)
          if (script.status !== 404) {
            const s = await script.text()
            //const base64rep = await this.imageUrlToBase64(absoluteUrl) as string
            $(elem).removeAttr("src")
            $(elem).text(s)
          }
        } catch (err: any) {
          console.log("err", err)
        }
      }
    }
  }

  async setBaseHref(url: URL, html: string) {


    // TODO puppeteer seems to have issues with this approach
    const headWithBase = "<head><base href=\"" + url.protocol + "//" + url.hostname + "/\" />"
    //const headWithBase = "<head>"

    const $ = cheerio.load(html);
    // $("link").each(function () {
    //   let href = $(this).attr("href");
    //   if (href && isRelative(href)) {
    //     // console.log("replaced", href, `${url.protocol}//${url.hostname}/${href}`)
    //     $(this).attr("href", `${url.protocol}//${url.hostname}/${href}`);
    //   }
    // });
    // $("script").each(function () {
    //   let src = $(this).attr("src");
    //   if (src && isRelative(src)) {
    //     $(this).attr("src", `${url.protocol}//${url.hostname}/${src}`);
    //   }
    // });
    // $("a").each(function () {
    //   let href = $(this).attr("href");
    //   if (href && isRelative(href)) {
    //     $(this).attr("href", `${url.protocol}//${url.hostname}/${href}`);
    //   }
    // });

    //
    // for (const elem of $('img')) {
    //   const src = $(elem).attr("src")
    //   if (src) { // && isRelative(src)) {
    //     const absoluteUrl = `${url.protocol}//${url.hostname}/${src}`
    //     const base64rep = await this.imageUrlToBase64(absoluteUrl) as string
    //     $(elem).attr("src", base64rep);
    //   }
    // }

    // console.log("------", $.html())
    return html.replace("<head>", headWithBase)
  }
}

export default new ContentUtils();
