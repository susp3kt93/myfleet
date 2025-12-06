import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Geocode an address to get latitude and longitude
 * @param {String} address - Address to geocode
 * @returns {Promise<{lat: Number, lng: Number, formattedAddress: String}>}
 */
export async function geocodeAddress(address) {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.warn('[MapsService] Google Maps API key not configured');
        return null;
    }

    try {
        const response = await client.geocode({
            params: {
                address: address,
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        if (response.data.results.length === 0) {
            console.warn('[MapsService] No results found for address:', address);
            return null;
        }

        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
            lat: location.lat,
            lng: location.lng,
            formattedAddress: result.formatted_address,
        };
    } catch (error) {
        console.error('[MapsService] Error geocoding address:', error.message);
        throw error;
    }
}

/**
 * Reverse geocode coordinates to get address
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<String>} - Formatted address
 */
export async function reverseGeocode(lat, lng) {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.warn('[MapsService] Google Maps API key not configured');
        return null;
    }

    try {
        const response = await client.reverseGeocode({
            params: {
                latlng: { lat, lng },
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        if (response.data.results.length === 0) {
            console.warn('[MapsService] No address found for coordinates:', lat, lng);
            return null;
        }

        return response.data.results[0].formatted_address;
    } catch (error) {
        console.error('[MapsService] Error reverse geocoding:', error.message);
        throw error;
    }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {Number} lat1 - Origin latitude
 * @param {Number} lng1 - Origin longitude
 * @param {Number} lat2 - Destination latitude
 * @param {Number} lng2 - Destination longitude
 * @returns {Number} - Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 * @param {Number} degrees
 * @returns {Number}
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Get distance matrix between origin and destination
 * @param {String} origin - Origin address or coordinates
 * @param {String} destination - Destination address or coordinates
 * @returns {Promise<Object>} - Distance and duration info
 */
export async function getDistanceMatrix(origin, destination) {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        console.warn('[MapsService] Google Maps API key not configured');
        return null;
    }

    try {
        const response = await client.distancematrix({
            params: {
                origins: [origin],
                destinations: [destination],
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        const element = response.data.rows[0].elements[0];

        if (element.status !== 'OK') {
            console.warn('[MapsService] Could not calculate distance');
            return null;
        }

        return {
            distance: element.distance.text,
            distanceValue: element.distance.value, // in meters
            duration: element.duration.text,
            durationValue: element.duration.value, // in seconds
        };
    } catch (error) {
        console.error('[MapsService] Error getting distance matrix:', error.message);
        throw error;
    }
}
