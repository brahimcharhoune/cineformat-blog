/**
 * Netlify Function: gh-push
 * Route: /.netlify/functions/gh-push
 *
 * Proxies file pushes to GitHub using the BLOG_TOKEN environment variable.
 * The token is NEVER sent to the browser.
 *
 * Set in Netlify Dashboard → Site → Environment Variables:
 *   BLOG_TOKEN = ghp_your_token_here
 */

exports.handler = async function (event) {

  // Health check — visit /.netlify/functions/gh-push in browser to confirm it's deployed
  if (event.httpMethod === 'GET') {
    const tokenSet = !!process.env.BLOG_TOKEN;
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        function: 'gh-push',
        BLOG_TOKEN_set: tokenSet
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Read token from Netlify environment — never from the request
  const token = process.env.BLOG_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'BLOG_TOKEN environment variable is not set in Netlify.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { owner, repo, branch = 'main', path, content, message } = payload;

  if (!owner || !repo || !path || !content || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required fields',
        received: { owner: !!owner, repo: !!repo, path: !!path, content: !!content, message: !!message }
      })
    };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  console.log('[gh-push] pushing to:', apiUrl, 'branch:', branch);

  // Step 1: Get current file SHA (required by GitHub API to update existing files)
  let sha = null;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    console.log('[gh-push] GET sha status:', getRes.status);
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
      console.log('[gh-push] existing sha:', sha);
    }
  } catch (e) {
    console.warn('[gh-push] SHA fetch error (may be new file):', e.message);
  }

  // Step 2: Push (create or update)
  const body = { message, content, branch };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  const resultText = await putRes.text();
  console.log('[gh-push] PUT status:', putRes.status, 'body:', resultText.slice(0, 300));

  let result = {};
  try { result = JSON.parse(resultText); } catch {}

  if (!putRes.ok) {
    return {
      statusCode: putRes.status,
      body: JSON.stringify({
        error: result.message || 'GitHub API error ' + putRes.status,
        github_url: apiUrl,
        github_status: putRes.status,
        github_response: result
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, commit: result.commit?.sha, path })
  };
};
