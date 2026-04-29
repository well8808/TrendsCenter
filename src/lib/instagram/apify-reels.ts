export async function fetchReelsFromProfile(usernames: string[]) {
  const token = process.env.APIFY_API_TOKEN

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-reel-scraper/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernames,
        maxReelsPerProfile: 10,
      }),
    }
  )

  const run = await runRes.json()
  const datasetId = run.data.defaultDatasetId

  await new Promise(r => setTimeout(r, 20000))

  const dataRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
  )

  return dataRes.json()
}
