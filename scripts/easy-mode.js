/* Floundermode Dictionary - Easy Mode JavaScript */

// Easy Mode state variables
let currentStep = 1;
let selectedTags = [];
let existingTags = [];

// Initialize profanity filter
let profanityFilter;
try {
  profanityFilter = new Filter();
} catch (error) {
  console.warn('Profanity filter not available:', error);
  profanityFilter = null;
}

// Custom Alert System
window.showCustomAlert = function(title, message) {
  const alertModal = document.getElementById("customAlert");
  const alertTitle = document.getElementById("alertTitle");
  const alertContent = document.getElementById("alertContent");
  
  alertTitle.textContent = title;
  alertContent.textContent = message;
  
  alertModal.classList.add("show");
};

window.closeCustomAlert = function() {
  const alertModal = document.getElementById("customAlert");
  alertModal.classList.remove("show");
};

// Input Validation and Security
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /javascript:/gi, // javascript: protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
  /data:(?!image\/)/gi, // Data URLs (except images)
  /vbscript:/gi, // VBScript
  /expression\s*\(/gi, // CSS expressions
  /import\s+/gi, // ES6 imports
  /eval\s*\(/gi, // eval() calls
  /Function\s*\(/gi, // Function constructor
  /setTimeout\s*\(/gi, // setTimeout with string
  /setInterval\s*\(/gi, // setInterval with string
];

async function validateInput(text, fieldName) {
  if (!text || text.trim().length === 0) {
    showCustomAlert("Validation Error", "Please enter a " + fieldName.toLowerCase() + ".");
    return false;
  }

  // Check for profanity using async API check
  if (profanityFilter) {
    try {
      const hasProfanity = await profanityFilter.isProfaneAsync(text);
      if (hasProfanity) {
        showCustomAlert("Content Policy Violation", "Your " + fieldName.toLowerCase() + " contains inappropriate language. You probably wouldn't say this in a pitch deck. Or maybe you would.");
        return false;
      }
    } catch (error) {
      console.warn('Profanity check failed, using fallback:', error);
      // Fallback to synchronous pattern check
      if (profanityFilter.isProfane(text)) {
        showCustomAlert("Content Policy Violation", "Your " + fieldName.toLowerCase() + " contains inappropriate language. You probably wouldn't say this in a pitch deck. Or maybe you would.");
        return false;
      }
    }
  }

  // Check for dangerous patterns
  for (let pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      showCustomAlert("Security Error", "Your input contains potentially dangerous content. Please remove any script tags or executable code.");
      return false;
    }
  }

  // Check length limits
  const limits = {
    'term name': 50,
    'definition': 200,
    'usage example': 150
  };

  if (text.length > limits[fieldName.toLowerCase()]) {
    showCustomAlert("Length Error", fieldName + " must be " + limits[fieldName.toLowerCase()] + " characters or less.");
    return false;
  }

  return true;
}

// Synchronous version for real-time checking (uses pattern detection only)
function validateInputSync(text, fieldName) {
  if (!text || text.trim().length === 0) {
    return { isValid: true, error: null };
  }

  // Check for profanity using sync pattern check
  if (profanityFilter && profanityFilter.isProfane(text)) {
    return { 
      isValid: false, 
      error: "inappropriate_language",
      message: "If you wouldn't say it in a pitch deck, you probably shouldn't say it here."
    };
  }

  // Check for dangerous patterns
  for (let pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      return { 
        isValid: false, 
        error: "security_violation",
        message: "Contains potentially dangerous content."
      };
    }
  }

  return { isValid: true, error: null };
}

// Extract tags from existing terms
function extractExistingTags() {
  // Access flounderTerms from main.js
  if (typeof flounderTerms === 'undefined') {
    console.warn('flounderTerms not available, using empty tag list');
    existingTags = [];
    return;
  }
  
  const allTags = new Set();
  flounderTerms.forEach(term => {
    term.related.forEach(tag => allTags.add(tag));
  });
  existingTags = Array.from(allTags).sort();
}

// Modal functions
window.openEasyModeModal = function() {
  const modal = document.getElementById("easyModeModal");
  if (typeof window.closeModal === 'function') {
    window.closeModal(); // Close any other open modal
  }
  modal.classList.remove("hide");
  modal.classList.add("show");
  resetForm();
  extractExistingTags();
};

window.closeEasyModeModal = function() {
  const modal = document.getElementById("easyModeModal");
  modal.classList.remove("show");
  modal.classList.add("hide");
};

// Step navigation
window.nextStep = async function() {
  if (await validateCurrentStep()) {
    if (currentStep < 4) {
      updateStep(currentStep + 1);
    }
  }
};

window.previousStep = function() {
  if (currentStep > 1) {
    updateStep(currentStep - 1);
  }
};

function updateStep(newStep) {
  // Hide current step
  document.querySelector('.form-step[data-step="' + currentStep + '"]').classList.remove("active");

  // Show new step
  currentStep = newStep;
  document.querySelector('.form-step[data-step="' + currentStep + '"]').classList.add("active");

  // Update progress bar
  updateProgressBar();

  // Update navigation buttons
  updateNavigation();
}

function updateProgressBar() {
  const progressFill = document.getElementById("progressFill");
  const currentStepText = document.getElementById("currentStepText");
  
  const progressWidth = ((currentStep - 1) / 4) * 100;
  progressFill.style.width = progressWidth + '%';
  currentStepText.textContent = currentStep;
}

function updateNavigation() {
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  const submitBtn = document.querySelector(".submit-btn");

  prevBtn.style.display = currentStep > 1 ? "block" : "none";
  
  if (currentStep === 4) {
    nextBtn.style.display = "none";
    submitBtn.style.display = "block";
  } else {
    nextBtn.style.display = "block";
    submitBtn.style.display = "none";
  }
}

// Calculate similarity between two strings using Levenshtein distance
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0; // Exact match
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance algorithm
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Check for duplicate and similar terms
function checkDuplicateTerm(termName) {
  if (!termName || !flounderTerms) return false;
  
  // Normalize the term name for comparison (lowercase, trim whitespace)
  const normalizedInput = termName.toLowerCase().trim();
  
  // Check for exact matches first
  const exactMatch = flounderTerms.find(term => 
    term.term.toLowerCase().trim() === normalizedInput
  );
  
  if (exactMatch) {
    showCustomAlert(
      "Duplicate Term Found", 
      `The term "${exactMatch.term}" already exists in the dictionary. ` +
      `Please choose a different term or check if you meant to suggest an edit to the existing one.`
    );
    return true; // Exact duplicate found
  }
  
  // Check for similar terms (similarity threshold of 0.8 = 80% similar)
  const SIMILARITY_THRESHOLD = 0.8;
  
  for (const term of flounderTerms) {
    const similarity = calculateSimilarity(termName, term.term);
    if (similarity >= SIMILARITY_THRESHOLD && similarity < 1.0) {
      showCustomAlert(
        "Similar Term Found", 
        `The term "${term.term}" is very similar to "${termName}". ` +
        `This might be a misspelling or variation. Please check the existing term ` +
        `or choose a more distinct name to avoid confusion.`
      );
      return true; // Similar term found
    }
  }
  
  return false; // No duplicate or similar term
}

async function validateCurrentStep() {
  const step = currentStep;
  
  if (step === 1) {
    const termName = document.getElementById("termName").value.trim();
    
    // First check basic validation
    if (!(await validateInput(termName, "Term name"))) {
      return false;
    }
    
    // Then check for duplicates
    if (checkDuplicateTerm(termName)) {
      return false;
    }
  }
  
  if (step === 2) {
    const definition = document.getElementById("termDefinition").value.trim();
    return await validateInput(definition, "Definition");
  }
  
  if (step === 3) {
    const usage = document.getElementById("termUsage").value.trim();
    return await validateInput(usage, "Usage example");
  }
  
  return true;
}

function resetForm() {
  currentStep = 1;
  selectedTags = [];
  
  // Reset form fields
  document.getElementById("easyModeForm").reset();
  
  // Reset form steps
  document.querySelectorAll(".form-step").forEach(step => {
    step.classList.remove("active");
  });
  
  // Show first step
  document.querySelector('.form-step[data-step="1"]').classList.add("active");
  
  // Reset progress bar
  updateProgressBar();
  
  // Reset selected tags display
  document.getElementById("selectedTags").innerHTML = "";
  document.getElementById("tagCount").textContent = "0";
  
  // Reset character counters
  document.getElementById("termCounter").textContent = "0";
  document.getElementById("definitionCounter").textContent = "0";
  document.getElementById("usageCounter").textContent = "0";
  
  // Hide duplicate and profanity warnings
  hideDuplicateWarning();
  hideProfanityWarning(document.getElementById("termName"));
  hideProfanityWarning(document.getElementById("termDefinition"));
  hideProfanityWarning(document.getElementById("termUsage"));
  
  updateNavigation();
}

// Show real-time duplicate or similarity warning
function showDuplicateWarning(termName, existingTerm, isExact = true) {
  const termInput = document.getElementById("termName");
  let warningEl = document.getElementById("duplicateWarning");
  
  // Create warning element if it doesn't exist
  if (!warningEl) {
    warningEl = document.createElement("div");
    warningEl.id = "duplicateWarning";
    warningEl.className = "duplicate-warning";
    termInput.parentNode.insertBefore(warningEl, termInput.nextSibling);
  }
  
  if (isExact) {
    warningEl.innerHTML = `
      ⚠️ Term "${existingTerm.term}" already exists. 
      <button type="button" class="view-existing-btn" onclick="viewExistingTerm('${existingTerm.term.replace(/'/g, "\\'")}')">
        View existing →
      </button>
    `;
    warningEl.className = "duplicate-warning";
  } else {
    warningEl.innerHTML = `
      🔍 Similar term "${existingTerm.term}" found. Possible misspelling? 
      <button type="button" class="view-existing-btn" onclick="viewExistingTerm('${existingTerm.term.replace(/'/g, "\\'")}')">
        View similar →
      </button>
    `;
    warningEl.className = "duplicate-warning similar-warning";
  }
  
  warningEl.style.display = "block";
}

function hideDuplicateWarning() {
  const warningEl = document.getElementById("duplicateWarning");
  if (warningEl) {
    warningEl.style.display = "none";
  }
}

// Show real-time profanity warning
function showProfanityWarning(inputElement, fieldName) {
  let warningEl = document.getElementById("profanityWarning_" + inputElement.id);
  
  // Create warning element if it doesn't exist
  if (!warningEl) {
    warningEl = document.createElement("div");
    warningEl.id = "profanityWarning_" + inputElement.id;
    warningEl.className = "profanity-warning";
    inputElement.parentNode.insertBefore(warningEl, inputElement.nextSibling);
  }
  
  warningEl.innerHTML = `
    🚫 Your ${fieldName.toLowerCase()} contains inappropriate language. If you wouldn't say it in a pitch deck, you probably shouldn't say it here.
  `;
  warningEl.style.display = "block";
}

function hideProfanityWarning(inputElement) {
  const warningEl = document.getElementById("profanityWarning_" + inputElement.id);
  if (warningEl) {
    warningEl.style.display = "none";
  }
}

// Function to view an existing term
window.viewExistingTerm = function(termName) {
  const existingTerm = flounderTerms.find(term => 
    term.term.toLowerCase().trim() === termName.toLowerCase().trim()
  );
  
  if (existingTerm && typeof window.openModal === 'function') {
    // Close easy mode modal first
    closeEasyModeModal();
    // Open the existing term modal
    window.openModal(existingTerm);
  }
};

// Character counters and real-time duplicate checking
function setupCharacterCounters() {
  const counters = [
    { input: "termName", counter: "termCounter" },
    { input: "termDefinition", counter: "definitionCounter" },
    { input: "termUsage", counter: "usageCounter" }
  ];

  counters.forEach(({ input, counter }) => {
    const inputEl = document.getElementById(input);
    const counterEl = document.getElementById(counter);
    
    if (inputEl && counterEl) {
      inputEl.addEventListener("input", () => {
        counterEl.textContent = inputEl.value.length;
        
        // Add real-time profanity checking for all fields
        if (inputEl.value.trim().length > 0) {
          const validation = validateInputSync(inputEl.value, input);
          if (!validation.isValid && validation.error === 'inappropriate_language') {
            const fieldNames = {
              'termName': 'Term name',
              'termDefinition': 'Definition', 
              'termUsage': 'Usage example'
            };
            showProfanityWarning(inputEl, fieldNames[input] || 'Field');
          } else {
            hideProfanityWarning(inputEl);
          }
        } else {
          hideProfanityWarning(inputEl);
        }

        // Add real-time duplicate and similarity checking for term name
        if (input === "termName") {
          const termName = inputEl.value.trim();
          if (termName.length > 2) { // Only check after 3+ characters
            const normalizedInput = termName.toLowerCase().trim();
            
            // First check for exact matches
            const exactMatch = flounderTerms.find(term => 
              term.term.toLowerCase().trim() === normalizedInput
            );
            
            if (exactMatch) {
              showDuplicateWarning(termName, exactMatch, true);
            } else {
              // Check for similar terms
              const SIMILARITY_THRESHOLD = 0.8;
              let similarTerm = null;
              
              for (const term of flounderTerms) {
                const similarity = calculateSimilarity(termName, term.term);
                if (similarity >= SIMILARITY_THRESHOLD && similarity < 1.0) {
                  similarTerm = term;
                  break; // Show the first similar term found
                }
              }
              
              if (similarTerm) {
                showDuplicateWarning(termName, similarTerm, false);
              } else {
                hideDuplicateWarning();
              }
            }
          } else {
            hideDuplicateWarning();
          }
        }
      });
    }
  });
}

// Tag system
function setupTagSystem() {
  const tagInput = document.getElementById("tagInput");
  const tagSuggestions = document.getElementById("tagSuggestions");
  
  if (!tagInput) return;
  
  tagInput.addEventListener("input", () => {
    const value = tagInput.value.toLowerCase().trim();
    if (value && selectedTags.length < 4) {
      showTagSuggestions(value);
    } else {
      hideTagSuggestions();
    }
  });

  tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput.value.trim());
    }
  });
}

function showTagSuggestions(query) {
  const suggestions = existingTags.filter(tag => 
    tag.toLowerCase().includes(query) && !selectedTags.includes(tag)
  );

  const suggestionsEl = document.getElementById("tagSuggestions");
  
  if (suggestions.length > 0) {
    suggestionsEl.innerHTML = suggestions.map(tag => 
      '<div class="tag-suggestion" onclick="addTag(\'' + tag + '\')">' + tag + '</div>'
    ).join("");
    suggestionsEl.style.display = "block";
  } else {
    hideTagSuggestions();
  }
}

function hideTagSuggestions() {
  const suggestionsEl = document.getElementById("tagSuggestions");
  if (suggestionsEl) {
    suggestionsEl.style.display = "none";
  }
}

window.addTag = async function(tag) {
  if (!tag || selectedTags.includes(tag) || selectedTags.length >= 4) return;
  
  // Check for profanity in tags
  if (profanityFilter) {
    try {
      const hasProfanity = await profanityFilter.isProfaneAsync(tag);
      if (hasProfanity) {
        showCustomAlert("Content Policy Violation", "The tag contains inappropriate language. That's crazy. In 2025? Sheeeesh.");
        return;
      }
    } catch (error) {
      // Fallback to sync check
      if (profanityFilter.isProfane(tag)) {
        showCustomAlert("Content Policy Violation", "The tag contains inappropriate language. That's crazy. In 2025? Sheeeesh.");
        return;
      }
    }
  }
  
  selectedTags.push(tag);
  updateTagsDisplay();
  document.getElementById("tagInput").value = "";
  hideTagSuggestions();
};

window.addTagFromInput = function() {
  const tagInput = document.getElementById("tagInput");
  const tag = tagInput.value.trim();
  if (tag) {
    addTag(tag);
  }
};

window.removeTag = function(tag) {
  selectedTags = selectedTags.filter(t => t !== tag);
  updateTagsDisplay();
};

function updateTagsDisplay() {
  const selectedTagsEl = document.getElementById("selectedTags");
  const tagCountEl = document.getElementById("tagCount");
  
  selectedTagsEl.innerHTML = selectedTags.map(tag => 
    '<div class="selected-tag">' +
      tag +
      '<span class="remove-tag" onclick="removeTag(\'' + tag + '\')">✕</span>' +
    '</div>'
  ).join("");
  
  tagCountEl.textContent = selectedTags.length;
  
  // Disable tag input and button if limit reached
  const tagInput = document.getElementById("tagInput");
  const tagEnterBtn = document.querySelector(".tag-enter-btn");
  
  if (selectedTags.length >= 4) {
    tagInput.disabled = true;
    tagInput.placeholder = "Maximum 4 tags reached";
    tagEnterBtn.disabled = true;
  } else {
    tagInput.disabled = false;
    tagInput.placeholder = "Type a tag and press Enter";
    tagEnterBtn.disabled = false;
  }
}

// PR Preview Modal functions
window.openPrPreviewModal = function() {
  const modal = document.getElementById("prPreviewModal");
  modal.classList.remove("hide");
  modal.classList.add("show");
};

window.closePrPreviewModal = function() {
  const modal = document.getElementById("prPreviewModal");
  modal.classList.remove("show");
  modal.classList.add("hide");
};

// Copy to clipboard functionality
window.copyToClipboard = async function(elementId) {
  const element = document.getElementById(elementId);
  const text = element.textContent || element.innerText;
  
  try {
    await navigator.clipboard.writeText(text);
    
    // Show feedback by changing the copy button temporarily
    const copyBtn = element.parentElement.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    copyBtn.style.background = '#4CAF50';
    copyBtn.style.color = 'white';
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '#ffe680';
      copyBtn.style.color = '#000';
    }, 2000);
    
  } catch (err) {
    console.error('Failed to copy text: ', err);
    // Fallback for older browsers
    fallbackCopyToClipboard(text);
  }
};

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showCustomAlert('Copied!', 'Content copied to clipboard successfully.');
  } catch (err) {
    showCustomAlert('Copy Failed', 'Unable to copy to clipboard. Please copy manually.');
  }
  
  document.body.removeChild(textArea);
}

// Generate filename for the new term
function generateTermFilename(termName) {
  // Convert term name to kebab-case filename
  return termName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Generate JSON code for the new term
function generateTermJson(termData) {
  // Create a properly formatted JSON object
  const termObject = {
    term: termData.term,
    definition: termData.definition,
    usage: termData.usage,
    related: termData.related || []
  };
  
  // Format with proper indentation (2 spaces)
  return JSON.stringify(termObject, null, 2);
}

// Generate PR title
function generatePrTitle(termData) {
  return `Add new term: ${termData.term}`;
}

// Generate GitHub URL for creating PR with pre-filled content
function generateGitHubUrl(termData) {
  const filename = generateTermFilename(termData.term);
  const jsonContent = generateTermJson(termData);
  const prTitle = generatePrTitle(termData);
  const prDescription = generatePrDescription(termData);
  
  // GitHub's web interface URL for creating a new file
  const baseUrl = 'https://github.com/FlounderFounder/default_website/new/main';
  
  // Encode the content for URL parameters
  const encodedJsonContent = encodeURIComponent(jsonContent);
  const encodedPrTitle = encodeURIComponent(prTitle);
  const encodedPrDescription = encodeURIComponent(prDescription);
  
  // Create the URL with pre-filled content
  const githubUrl = `${baseUrl}?filename=terms/${filename}.json&value=${encodedJsonContent}&message=${encodedPrTitle}&description=${encodedPrDescription}`;
  
  return githubUrl;
}

// Generate PR description
function generatePrDescription(termData) {
  const filename = generateTermFilename(termData.term);
  return `## Adding New Term: ${termData.term}

**File:** \`terms/${filename}.json\`

**Definition:** ${termData.definition}

**Usage Example:** ${termData.usage}

**Related Tags:** ${termData.related.length > 0 ? termData.related.join(', ') : 'None'}

---

This pull request adds a new term to the Floundermode Dictionary by creating a new JSON file in the \`terms/\` directory. The term has been validated and follows the contribution guidelines.

### Changes Made
- ✅ Created new file: \`terms/${filename}.json\`
- ✅ Generated HTML page: \`pages/${filename}.html\` (automated)
- ✅ Added term to main.js termFiles array (automated)
- ✅ Updated site to include the new term

### Checklist
- [x] Term is unique and not already in the dictionary
- [x] Definition is clear and concise
- [x] Usage example demonstrates the term appropriately
- [x] Related tags are relevant and helpful
- [x] Filename follows kebab-case convention`;
}

// Show PR preview with generated content
function showPrPreview(termData) {
  // Generate the content
  const prTitle = generatePrTitle(termData);
  const prDescription = generatePrDescription(termData);
  const jsonCode = generateTermJson(termData);
  const filename = generateTermFilename(termData.term);
  const githubUrl = generateGitHubUrl(termData);
  
  // Populate the modal content
  document.getElementById('prTitle').textContent = prTitle;
  document.getElementById('prDescription').textContent = prDescription;
  
  // Update the code block to show file creation
  const codeChangesEl = document.getElementById('codeChanges');
  codeChangesEl.textContent = jsonCode;
  
  // Update the code header to show the filename
  const codeLabelEl = document.querySelector('.code-label');
  if (codeLabelEl) {
    codeLabelEl.textContent = `New file: terms/${filename}.json`;
  }
  
  // Update the GitHub button to use the automated URL
  const githubBtn = document.querySelector('.pr-btn.primary');
  if (githubBtn) {
    githubBtn.onclick = () => window.open(githubUrl, '_blank');
    githubBtn.innerHTML = '🚀 Create PR Automatically →';
  }
  
  // Show the modal
  openPrPreviewModal();
}

// Form submission
async function submitTerm(termData) {
  try {
    // Final duplicate check before submission
    if (checkDuplicateTerm(termData.term)) {
      return; // Stop submission if duplicate found
    }
    
    // Show the PR preview instead of the simple alert
    showPrPreview(termData);
    
    // Close the easy mode modal after a short delay
    setTimeout(() => {
      closeEasyModeModal();
    }, 500);
    
  } catch (error) {
    console.error("Error generating PR preview:", error);
    showCustomAlert("Error", "There was an error generating the PR preview. Please try again.");
  }
}

// Initialize Easy Mode when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Setup Easy Mode features
  setupCharacterCounters();
  setupTagSystem();
  
  // Setup form submission
  const form = document.getElementById("easyModeForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (!(await validateCurrentStep())) return;
      
      const formData = {
        term: document.getElementById("termName").value.trim(),
        definition: document.getElementById("termDefinition").value.trim(),
        usage: document.getElementById("termUsage").value.trim(),
        related: selectedTags
      };
      
      try {
        await submitTerm(formData);
      } catch (error) {
        console.error("Error submitting term:", error);
        showCustomAlert("Submission Error", "There was an error submitting your term. Please try again.");
      }
    });
  }
});
