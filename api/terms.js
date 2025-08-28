/**
 * Serverless API endpoint for Floundermode Dictionary
 * Acts as a secure proxy between frontend and Airtable
 */
const AirtableService = require('../scripts/airtable-service');

export default async function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize AirtableService with server-side credentials
    const airtableService = new AirtableService({
      token: process.env.AIRTABLE_TOKEN,
      baseId: process.env.AIRTABLE_BASE_ID
    });

    if (req.method === 'GET') {
      const { slug, search, health } = req.query;
      
      // Health check endpoint
      if (health === 'true') {
        const status = await airtableService.getHealthStatus();
        return res.json(status);
      }
      
      // Get definitions for specific term
      if (slug) {
        try {
          const definitions = await airtableService.fetchDefinitionsForTerm(slug);
          return res.json({
            success: true,
            data: definitions,
            count: definitions.length
          });
        } catch (error) {
          return res.status(404).json({
            success: false,
            error: 'Term not found',
            message: error.message
          });
        }
      }
      
      // Search terms
      if (search) {
        try {
          const results = await airtableService.searchTerms(search);
          return res.json({
            success: true,
            data: results,
            count: results.length
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
          });
        }
      }
      
      // Get all terms (default)
      try {
        const terms = await airtableService.fetchTerms();
        return res.json({
          success: true,
          data: terms,
          count: terms.length
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch terms',
          message: error.message
        });
      }
    }

    if (req.method === 'POST') {
      const { action, definitionId, voteType, userId, termName, definitionData } = req.body;
      
      // Handle voting
      if (action === 'vote') {
        if (!definitionId || !voteType || !userId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields for voting'
          });
        }
        
        try {
          const result = await airtableService.submitVote(definitionId, voteType, userId);
          return res.json(result);
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Vote submission failed',
            message: error.message
          });
        }
      }
      
      // Handle new definition submission
      if (action === 'submit_definition') {
        if (!termName || !definitionData) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields for definition'
          });
        }
        
        try {
          const result = await airtableService.submitDefinition(termName, definitionData);
          return res.json(result);
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Definition submission failed',
            message: error.message
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid action specified'
      });
    }

    // Method not allowed
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // Return error with fallback suggestion
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      fallback: true
    });
  }
}
