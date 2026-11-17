/* Leva V2 campaign entry counter: deployment opt-in.
 * HTTPS-only, five fixed campaign routes. Never forwards URL query strings,
 * cookies, financial inputs, user IDs, referer headers or IP addresses.
 * Counts are HTTP requests, not people or qualified leads.
 */
const DESTINATION = "https://levaventures.com/tools/financing-intelligence/";
const CHANNELS = Object.freeze({
  "/go/linkedin": "linkedin",
  "/go/sior": "sior",
  "/go/cre-news": "cre-news",
  "/go/crej": "crej",
  "/go/partners": "partners"
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== "levaventures.com" || url.protocol !== "https:") {
      return new Response("Not found", {status:404,headers:{"Cache-Control":"no-store"}});
    }
    const channel = CHANNELS[url.pathname.replace(/\/$/, "")];
    if (!channel) return new Response("Not found", {status:404,headers:{"Cache-Control":"no-store"}});
    if (request.method !== "GET") {
      return new Response(null,{status:405,headers:{"Allow":"GET","Cache-Control":"no-store"}});
    }
    if (env?.CAMPAIGN_COUNTS && typeof env.CAMPAIGN_COUNTS.writeDataPoint === "function") {
      try {
        env.CAMPAIGN_COUNTS.writeDataPoint({blobs:[channel],doubles:[1]});
      } catch {
        // Preserve clean redirect; do not send information to another endpoint.
      }
    }
    return new Response(null,{
      status:302,
      headers:{
        "Location":DESTINATION,
        "Cache-Control":"no-store, max-age=0",
        "Referrer-Policy":"no-referrer",
        "X-Robots-Tag":"noindex, nofollow"
      }
    });
  }
};
