/* Floundermode Dictionary - Easy Mode JavaScript */

// Easy Mode state variables
let currentStep = 1;
let selectedTags = [];
let existingTags = [];

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

function validateInput(text, fieldName) {
  if (!text || text.trim().length === 0) {
    showCustomAlert("Validation Error", "Please enter a " + fieldName.toLowerCase() + ".");
    return false;
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
window.nextStep = function() {
  if (validateCurrentStep()) {
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
  
  const progressWidth = (currentStep / 4) * 100;
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

function validateCurrentStep() {
  const step = currentStep;
  
  if (step === 1) {
    const termName = document.getElementById("termName").value.trim();
    return validateInput(termName, "Term name");
  }
  
  if (step === 2) {
    const definition = document.getElementById("termDefinition").value.trim();
    return validateInput(definition, "Definition");
  }
  
  if (step === 3) {
    const usage = document.getElementById("termUsage").value.trim();
    return validateInput(usage, "Usage example");
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
  
  updateNavigation();
}

// Character counters
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

window.addTag = function(tag) {
  if (!tag || selectedTags.includes(tag) || selectedTags.length >= 4) return;
  
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

// Form submission
async function submitTerm(termData) {
  // For now, show a preview of what would be submitted
  const previewMessage = 'Term: ' + termData.term + '\n\nDefinition: ' + termData.definition + '\n\nUsage: ' + termData.usage + '\n\nTags: ' + termData.related.join(", ") + '\n\nGitHub PR creation coming soon!';
  
  showCustomAlert('Term Ready for Submission!', previewMessage);
  
  setTimeout(() => {
    closeEasyModeModal();
  }, 1000);
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
      
      if (!validateCurrentStep()) return;
      
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
