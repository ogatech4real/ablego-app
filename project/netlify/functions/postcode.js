// Netlify serverless function for UK postcode lookup
// Handles CORS and provides a reliable API proxy

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract postcode from path parameters
    const pathSegments = event.path.split('/');
    const postcode = pathSegments[pathSegments.length - 1];

    if (!postcode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Postcode parameter is required',
          usage: 'GET /.netlify/functions/postcode/{postcode}'
        })
      };
    }

    // Clean and validate postcode format
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // Basic UK postcode format validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/;
    if (!postcodeRegex.test(cleanPostcode)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid UK postcode format',
          provided: postcode,
          expected: 'Format like SW1A1AA or M11AA'
        })
      };
    }

    // Fetch from postcodes.io API
    const apiUrl = `https://api.postcodes.io/postcodes/${cleanPostcode}`;
    console.log(`Fetching postcode data from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'AbleGo-App/1.0',
        'Accept': 'application/json'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    // Handle API response
    if (!response.ok) {
      if (response.status === 404) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Postcode not found',
            postcode: cleanPostcode,
            valid: false
          })
        };
      }

      throw new Error(`Postcodes.io API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.result) {
      throw new Error('Invalid response format from postcodes.io');
    }

    // Return successful response with postcode data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        postcode: data.result.postcode,
        latitude: data.result.latitude,
        longitude: data.result.longitude,
        district: data.result.admin_district,
        region: data.result.region,
        country: data.result.country,
        formatted_address: [
          data.result.admin_ward,
          data.result.admin_district,
          data.result.region,
          data.result.postcode
        ].filter(Boolean).join(', '),
        raw_data: data.result // Include full data for debugging
      })
    };

  } catch (error) {
    console.error('Postcode lookup error:', error);

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({ 
          error: 'Request timeout - postcodes.io API is slow to respond',
          retry: true
        })
      };
    }

    // Handle network errors
    if (error.message.includes('fetch')) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Unable to connect to postcodes.io API',
          retry: true
        })
      };
    }

    // Generic error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        retry: true
      })
    };
  }
};