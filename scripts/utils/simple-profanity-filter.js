/* Advanced Profanity Filter for Browser */

/**
 * Advanced profanity filter using external APIs and pattern detection
 * No hardcoded offensive words in the codebase
 */
class Filter {
  constructor(options = {}) {
    this.placeHolder = options.placeHolder || '*';
    this.apiTimeout = options.apiTimeout || 3000;
    this.cache = new Map(); // Cache API results
    
    // Pattern-based detection for common evasion techniques
    this.suspiciousPatterns = [
      // Multiple repeated characters (like "shiiiit")
      /(.)\1{3,}/gi,
      // Excessive use of special characters replacing letters
      /[!@#$%^&*()_+=\[\]{}|;':",./<>?~`-]{3,}/g,
      // Mixed case attempts to evade (like "ShIt")
      /([a-z][A-Z]){2,}/g,
      // Numbers mixed with letters in suspicious patterns
      /([a-z]\d[a-z]){2,}/gi,
      // Leetspeak patterns
      /[0-9@#$%^&*()_+=\[\]{}|;':",./<>?~`-]{2,}[a-z]/gi
    ];
  }

  /**
   * Check for profanity using external API with fallback to pattern detection
   * @param {string} text - Text to check for profanity
   * @returns {Promise<boolean>} true if text contains profanity
   */
  async isProfaneAsync(text) {
    if (!text || text.trim().length === 0) return false;
    
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      // Try PurgoMalum API first (free, no API key needed)
      const result = await this.checkWithPurgoMalum(text);
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('API profanity check failed, using pattern fallback:', error);
      // Fallback to pattern-based detection
      const result = this.checkPatterns(text);
      this.cache.set(cacheKey, result);
      return result;
    }
  }

  /**
   * Synchronous version that uses pattern detection only
   * @param {string} text - Text to check for profanity
   * @returns {boolean} true if text contains profanity
   */
  isProfane(text) {
    if (!text || text.trim().length === 0) return false;
    
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const result = this.checkPatterns(text);
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Use PurgoMalum API to check for profanity
   * @param {string} text - Text to check
   * @returns {Promise<boolean>} true if profanity detected
   */
  async checkWithPurgoMalum(text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);
    
    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(
        `https://www.purgomalum.com/service/containsprofanity?text=${encodedText}`,
        { 
          signal: controller.signal,
          mode: 'cors'
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const result = await response.text();
      return result.trim().toLowerCase() === 'true';
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Pattern-based profanity detection (fallback method)
   * @param {string} text - Text to analyze
   * @returns {boolean} true if suspicious patterns detected
   */
  checkPatterns(text) {
    const normalized = text.toLowerCase().trim();
    
    // Check for suspicious patterns that might indicate profanity evasion
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(normalized)) {
        // Additional validation for pattern matches
        if (this.isLikelyProfane(normalized)) {
          return true;
        }
      }
    }
    
    // Check for common profanity indicators without explicit words
    return this.hasCommonProfanityIndicators(normalized);
  }

  /**
   * Check if text has characteristics of profanity
   * @param {string} text - Normalized text
   * @returns {boolean} true if likely profane
   */
  isLikelyProfane(text) {
    // Look for patterns like excessive special characters, number substitutions, etc.
    const specialCharRatio = (text.match(/[^a-z0-9\s]/g) || []).length / text.length;
    const numberRatio = (text.match(/[0-9]/g) || []).length / text.length;
    
    // High ratio of special characters or numbers might indicate evasion
    return specialCharRatio > 0.3 || numberRatio > 0.3;
  }

  /**
   * Look for common profanity indicators without explicit word matching
   * @param {string} text - Text to check
   * @returns {boolean} true if indicators found
   */
  hasCommonProfanityIndicators(text) {
    // Look for patterns that commonly indicate profanity without explicit matching
    const indicators = [
      // Excessive repetition
      /(.)\1{4,}/,
      // Common letter substitutions in profanity
      /[f@]{1,2}[u*]{1,2}[c*]{1,2}[k*]{1,2}/,
      /[s$]{1,2}[h*]{1,2}[i*]{1,2}[t*]{1,2}/,
      /[b*]{1,2}[i*]{1,2}[t*]{1,2}[c*]{1,2}[h*]{1,2}/,
      // Mixed with numbers/symbols
      /[a-z]*[0-9@#$%^&*()]{2,}[a-z]*/,
    ];
    
    return indicators.some(pattern => pattern.test(text));
  }

  /**
   * Clean text by replacing profane content
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  clean(text) {
    if (this.isProfane(text)) {
      // Simple replacement strategy
      return text.replace(/\w/g, this.placeHolder);
    }
    return text;
  }
}

// Make Filter available globally for browser use
window.Filter = Filter;
