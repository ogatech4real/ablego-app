// Netlify function for reverse geocoding (coordinates to postcode)

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { lat, lng } = event.queryStringParameters || {};

    if (!lat || !lng) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Latitude and longitude parameters required',
          usage: 'GET /.netlify/functions/postcode-reverse?lat=51.5074&lng=-0.1278'
        })
      };
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid coordinates' })
      };
    }

    // Call postcodes.io reverse geocoding API
    const response = await fetch(
      `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(8000) // 8 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'No postcode found for these coordinates',
          latitude,
          longitude
        })
      };
    }

    const result = data.result[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        postcode: result.postcode,
        latitude: result.latitude,
        longitude: result.longitude,
        district: result.admin_district,
        region: result.region,
        country: result.country,
        formatted_address: [
          result.admin_ward,
          result.admin_district,
          result.region,
          result.postcode
        ].filter(Boolean).join(', ')
      })
    };

  } catch (error) {
    console.error('Reverse geocoding error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Reverse geocoding failed',
        message: error.message
      })
    };
  }
};