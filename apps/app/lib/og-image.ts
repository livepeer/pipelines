export async function getOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Look for og:image meta tag
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
    if (ogImageMatch && ogImageMatch[1]) {
      return ogImageMatch[1];
    }
    
    // Look for twitter:image meta tag as fallback
    const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterImageMatch && twitterImageMatch[1]) {
      return twitterImageMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching og-image:', error);
    return null;
  }
} 