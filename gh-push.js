/**
 * Netlify Function: gh-push
 * Route: /.netlify/functions/gh-push
 *
 * Receives a push request from the admin dashboard and forwards it
 * to the GitHub Contents API using the BLOG_TOKEN environment variable.
 * The token is NEVER sent to the browser.
 *
 * Set BLOG_TOKEN in: Netlify Dashboard → Site → Environment Variables
 */

exports.handler = async function (event) {
  // Only allow POST
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
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: owner, repo, path, content, message' }) };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  // Step 1: Get current file SHA (required by GitHub API to update existing files)
  let sha = null;
  try {
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }
  } catch {
    // File does not exist yet — sha stays null, that's fine for new files
  }

  // Step 2: Push (create or update)
  const body = { message, content, branch };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  const result = await putRes.json().catch(() => ({}));

  if (!putRes.ok) {
    return {
      statusCode: putRes.status,
      body: JSON.stringify({
        error: result.message || 'GitHub API error ' + putRes.status,
        detail: `PUT ${apiUrl} → ${putRes.status}`,
        github: result
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, commit: result.commit?.sha })
  };
};
