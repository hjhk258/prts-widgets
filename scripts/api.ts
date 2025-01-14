import type { Method, SearchParameters } from "got";
import got from "got";
import { CookieJar } from "tough-cookie";

const entry = "https://prts.wiki/api.php";
const cookieJar = new CookieJar();
async function request({
  method,
  body,
  query,
}: {
  method?: Method;
  body?: Record<string, any>;
  query?: SearchParameters | URLSearchParams;
}): Promise<any> {
  return got(entry, {
    method: method || "GET",
    cookieJar,
    form: body,
    searchParams: query,
  }).json();
}
export async function getCsrfToken() {
  const resp = await request({
    method: "GET",
    query: {
      action: "query",
      meta: "tokens",
      type: "csrf",
      format: "json",
    },
  });
  return resp.query.tokens.csrftoken;
}
async function getLoginToken() {
  const resp = await request({
    query: {
      action: "query",
      meta: "tokens",
      format: "json",
      type: "login",
    },
  });
  return resp?.query?.tokens?.logintoken;
}
export async function login(name: string, password: string) {
  const token = await getLoginToken();
  if (!token) throw new Error("get login token failed");

  const resp = await request({
    method: "POST",
    body: {
      action: "login",
      lgname: name,
      lgpassword: password,
      lgtoken: token,
      format: "json",
    },
  });
  if (resp?.login?.result?.toLowerCase() !== "success") {
    console.error(JSON.stringify(resp));
    throw new Error(resp);
  }
}
export async function create(
  pagename: string,
  content: string,
  summary = "by prts-micro-frontends script",
) {
  const token = await getCsrfToken();
  const resp = await request({
    method: "POST",
    body: {
      action: "edit",
      title: pagename,
      text: content,
      bot: 1,
      summary,
      token,
      format: "json",
      createonly: 1,
    },
  });
  console.log(resp);
}
export async function edit(
  pagename: string,
  content: string,
  summary = "by prts-micro-frontends script",
) {
  const token = await getCsrfToken();
  const resp = await request({
    method: "POST",
    body: {
      action: "edit",
      title: pagename,
      text: content,
      bot: 1,
      summary,
      token,
      format: "json",
    },
  });
  console.log(resp);
}
async function view(pagename: string) {
  return got(`https://prts.wiki/w/${pagename}`);
}
export async function checkPageExist(pagename: string) {
  try {
    await view(pagename);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
