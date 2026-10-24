// Live Google reviews for the homepage via the Places API (New).
// Needs GOOGLE_PLACES_API_KEY. GOOGLE_PLACE_ID is optional; without it the
// place is looked up by name once per cold start.
// Google returns at most 5 reviews per request ("most relevant").

const SEARCH_QUERY = 'Medico Scientific Service Centre, Iqbal Complex, Srinagar';
let cachedPlaceId = process.env.GOOGLE_PLACE_ID || null;

async function findPlaceId(key) {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'places.id'
        },
        body: JSON.stringify({ textQuery: SEARCH_QUERY })
    });
    if (!res.ok) throw new Error(`searchText ${res.status}`);
    const data = await res.json();
    return data.places && data.places[0] ? data.places[0].id : null;
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
        res.setHeader('Cache-Control', 'public, s-maxage=3600');
        return res.status(200).json({ success: false, configured: false, reviews: [], message: 'Reviews not configured.' });
    }

    try {
        if (!cachedPlaceId) cachedPlaceId = await findPlaceId(key);
        if (!cachedPlaceId) return res.status(404).json({ success: false, message: 'Place not found.' });

        const placeRes = await fetch(`https://places.googleapis.com/v1/places/${cachedPlaceId}?languageCode=en`, {
            headers: {
                'X-Goog-Api-Key': key,
                'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews'
            }
        });
        if (!placeRes.ok) throw new Error(`place details ${placeRes.status}`);
        const place = await placeRes.json();

        const reviews = (place.reviews || [])
            .filter((r) => r.rating >= 4 && r.text && r.text.text)
            .map((r) => ({
                author: r.authorAttribution ? r.authorAttribution.displayName : 'Google user',
                photo: r.authorAttribution ? r.authorAttribution.photoUri : null,
                profile: r.authorAttribution ? r.authorAttribution.uri : null,
                rating: r.rating,
                time: r.relativePublishTimeDescription,
                text: r.text.text
            }));

        // Cache at the edge for a day; serve stale for a week while refreshing.
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        return res.json({
            success: true,
            rating: place.rating,
            count: place.userRatingCount,
            url: place.googleMapsUri,
            reviews
        });
    } catch (err) {
        console.error('google-reviews:', err.message);
        return res.status(502).json({ success: false, message: 'Could not load reviews.' });
    }
};
