/* Floundermode Dictionary - Share Utilities */

// Share definition function - now opens modal instead of direct sharing
function shareDefinition(definitionId) {
  // Find the definition in our data
  let definition = null;
  let termName = '';
  
  // Get terms from DataLoader module
  const flounderTerms = window.DataLoader ? window.DataLoader.getAllTerms() : [];
  
  for (const term of flounderTerms) {
    if (term.definitions) {
      const def = term.definitions.find(d => d.id === definitionId);
      if (def) {
        definition = def;
        termName = term.term;
        break;
      }
    }
  }
  
  if (!definition) return;

  // Open share modal with the definition data
  openShareModal(definitionId, termName, definition);
}

// Open share modal with definition data
function openShareModal(definitionId, termName, definition) {
  const modal = document.getElementById('shareModal');
  if (!modal) return;

  // Generate share link
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/pages/${termName.toLowerCase().replace(/\s+/g, '-')}.html#${definitionId}`;
  
  // Store current definition data for theme updates
  window.currentShareData = { definitionId, termName, definition };
  
  // Generate initial embed code (light mode by default)
  updateEmbedCode();
  
  // Update modal content
  document.getElementById('shareLink').textContent = shareUrl;
  
  // Create preview
  createEmbedPreview(termName, definition);
  
  // Show modal
  modal.classList.remove('hide');
  modal.classList.add('active');
}

// Generate embed code for the definition
function generateEmbedCode(termName, definition, theme = 'light') {
  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${termName.toLowerCase().replace(/\s+/g, '-')}.html?theme=${theme}`;
  
  const borderColor = theme === 'dark' ? '#333' : '#000';
  const shadowColor = theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)';
  
  return `<iframe src="${embedUrl}" width="400" height="200" frameborder="0" style="border: 2px solid ${borderColor}; border-radius: 8px; box-shadow: 0 4px 8px ${shadowColor};"></iframe>`;
}

// Update embed code based on selected theme
function updateEmbedCode() {
  if (!window.currentShareData) return;
  
  const { termName, definition } = window.currentShareData;
  const selectedTheme = document.querySelector('input[name="embedTheme"]:checked')?.value || 'light';
  
  const embedCode = generateEmbedCode(termName, definition, selectedTheme);
  document.getElementById('embedCode').textContent = embedCode;
  
  // Update preview to match selected theme
  createEmbedPreview(termName, definition, selectedTheme);
}

// Create embed preview
function createEmbedPreview(termName, definition, theme = 'light') {
  const preview = document.getElementById('embedPreview');
  if (!preview) return;
  
  const isDark = theme === 'dark';
  const modalClass = isDark ? 'embed-modal-preview dark-theme' : 'embed-modal-preview';
  
  preview.innerHTML = `
    <div class="${modalClass}">
      <div class="embed-window-bar">
        <span class="embed-title">${termName}</span>
        <div class="embed-window-buttons">
          <div class="embed-window-button minimize">−</div>
          <div class="embed-window-button maximize">□</div>
          <div class="embed-window-button close">×</div>
        </div>
      </div>
      <div class="embed-content">
        <div class="embed-term-name">
          <h3 class="embed-term-title">${termName}</h3>
        </div>
        <div class="embed-definition-section">
          <div class="embed-section-title">DEFINITION</div>
          <div class="embed-content-block definition-block">
            <div class="embed-accent-bar definition-accent"></div>
            <div class="embed-text-content">${definition.definition}</div>
          </div>
        </div>
        <div class="embed-usage-section">
          <div class="embed-section-title">EXAMPLE</div>
          <div class="embed-content-block usage-block">
            <div class="embed-accent-bar usage-accent"></div>
            <div class="embed-text-content">"${definition.usage}"</div>
          </div>
        </div>
        <div class="embed-footer">
          <p class="embed-author">— ${definition.author || 'Anonymous'}</p>
          <p class="embed-source">From <a href="${window.location.origin}" target="_blank">Floundermode Dictionary</a></p>
        </div>
      </div>
    </div>
  `;
}

// Close share modal
function closeShareModal() {
  const modal = document.getElementById('shareModal');
  if (modal) {
    modal.classList.add('hide');
    modal.classList.remove('active');
  }
}

// Open share link in new tab
function openShareLink() {
  const shareLink = document.getElementById('shareLink');
  if (shareLink && shareLink.textContent) {
    window.open(shareLink.textContent, '_blank');
  }
}


// Share term function (for individual term pages) - now opens modal
function shareTerm(termName, definitions) {
  if (!definitions || definitions.length === 0) return;
  
  const primaryDef = definitions.find(def => def.isPrimary) || definitions[0];
  
  // Open share modal with the primary definition
  openShareModal(primaryDef.id, termName, primaryDef);
}

// Show toast notification
function showToast(message, duration = 3000) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// Export functions for use by other modules
window.ShareUtils = {
  shareDefinition,
  shareTerm,
  showToast,
  openShareModal,
  closeShareModal,
  openShareLink,
  updateEmbedCode
};

// Make functions globally available for HTML onclick handlers
window.shareDefinition = shareDefinition;
window.shareTerm = shareTerm;
window.closeShareModal = closeShareModal;
window.openShareLink = openShareLink;
window.updateEmbedCode = updateEmbedCode;
