/* Simple Profanity Filter for Browser */

/**
 * Browser-compatible profanity filter
 * Based on the bad-words library but simplified for direct browser use
 */
class Filter {
  constructor(options = {}) {
    // Common profanity words list (subset of bad-words library)
    this.list = [
      // Mild profanity
      'damn', 'hell', 'crap', 'shit', 'piss', 'fuck', 'bitch', 'ass', 'asshole',
      // Stronger profanity
      'bastard', 'whore', 'slut', 'dickhead', 'motherfucker', 'cocksucker',
      // Derogatory terms
      'retard', 'faggot', 'nigger', 'chink', 'spic', 'kike', 'wetback',
      // Sexual content
      'cock', 'dick', 'pussy', 'tits', 'boobs', 'penis', 'vagina', 'dildo',
      // Additional common variants
      'f*ck', 'sh*t', 'b*tch', 'a$$', 'fuk', 'shyt', 'biatch'
    ];
    
    this.exclude = options.exclude || [];
    this.placeHolder = options.placeHolder || '*';
    this.regex = /[^a-zA-Z0-9|$|@]|\^/g;
    this.replaceRegex = /\w/g;
    this.splitRegex = /\b|_/g;
    
    // Remove excluded words from the list
    if (this.exclude.length > 0) {
      this.list = this.list.filter(word => !this.exclude.includes(word.toLowerCase()));
    }
    
    // Add custom words if provided
    if (options.list && Array.isArray(options.list)) {
      this.list = this.list.concat(options.list);
    }
    
    // Remove duplicates and convert to lowercase
    this.list = [...new Set(this.list.map(word => word.toLowerCase()))];
  }

  /**
   * Determine if a string contains profane language.
   * @param {string} string - String to evaluate for profanity.
   * @returns {boolean} true if string contains profane language.
   */
  isProfane(string) {
    return this.list.some(word => {
      const wordExp = new RegExp(
        `\\b${word.replace(/(\W)/g, '\\$1')}\\b`,
        'gi'
      );
      return wordExp.test(string);
    });
  }

  /**
   * Replace a word with placeHolder characters;
   * @param {string} string - The string to replace.
   * @returns {string} The string with profane words replaced.
   */
  replaceWord(string) {
    return string.replace(this.replaceRegex, this.placeHolder);
  }

  /**
   * Evaluate a string for profanity and return an edited version.
   * @param {string} string - Profane string to clean.
   * @returns {string} The cleaned string.
   */
  clean(string) {
    return string.split(this.splitRegex).map(word => {
      return this.isProfane(word) ? this.replaceWord(word) : word;
    }).join('');
  }

  /**
   * Add word(s) to the blocklist filter / remove words from allowlist filter
   * @param {...string} words - The word(s) to add to the blocklist
   */
  addWords(...words) {
    this.list.push(...words.map(word => word.toLowerCase()));
    this.list = [...new Set(this.list)]; // Remove duplicates
  }

  /**
   * Add words to the allowlist filter
   * @param {...string} words - The word(s) to remove from the blocklist
   */
  removeWords(...words) {
    this.list = this.list.filter(word => 
      !words.some(removeWord => removeWord.toLowerCase() === word)
    );
  }
}

// Make Filter available globally for browser use
window.Filter = Filter;
