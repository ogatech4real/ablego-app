// Netlify function for postcode validation only
// Lightweight validation endpoint

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
    const pathSegments = event.path.split('/');
    const postcode = pathSegments[pathSegments.length - 1];

    if (!postcode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Postcode required' })
      };
    }

    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // Validate format first (faster than API call)
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/;
    if (!postcodeRegex.test(cleanPostcode)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: false, postcode: cleanPostcode })
      };
    }

    // Quick validation call to postcodes.io
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}/validate`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout for validation
    });

    if (!response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: false, postcode: cleanPostcode })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        valid: data.result === true, 
        postcode: cleanPostcode 
      })
    };

  } catch (error) {
    console.error('Validation error:', error);
    
    // Return false for validation on any error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        valid: false, 
        error: 'Validation service unavailable' 
      })
    };
  }
};