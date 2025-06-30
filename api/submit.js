export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Import fetch dynamically for Node.js compatibility
    const fetch = (await import('node-fetch')).default;
    
    console.log('Environment variables check:', {
      baseId: process.env.AIRTABLE_BASE_ID ? 'SET' : 'NOT SET',
      tableName: process.env.AIRTABLE_TABLE_NAME ? 'SET' : 'NOT SET',
      apiKey: process.env.AIRTABLE_API_KEY ? 'SET' : 'NOT SET'
    });

    console.log('Request body:', req.body);

    // Map form values to match Airtable schema
    const fields = {
      'Name': req.body.name,
      'Company': req.body.company,
      'Problem': req.body.problem,
      'Budget': req.body.budget,
      'Industry': req.body.industry
    };

    // Only add Position if it has a value, to avoid select field issues
    if (req.body.position && req.body.position.trim() !== '') {
      fields['Position'] = req.body.position;
    }

    console.log('Fields being sent to Airtable:', fields);

    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: fields
      })
    });

    const responseData = await response.json();
    console.log('Airtable response:', responseData);

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      console.error('Airtable API error:', responseData);
      throw new Error(`Airtable API error: ${responseData.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}