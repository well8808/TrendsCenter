import { fetchReelsFromProfile } from '@/lib/instagram/apify-reels'

export async function GET() {
  const reels = await fetchReelsFromProfile(['kerolaychaves', 'virginiafonseca'])
  return Response.json(reels)
}
