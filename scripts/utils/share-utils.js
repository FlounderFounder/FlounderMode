/* Floundermode Dictionary - Share Utilities */

// Share definition function
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

  const shareText = `${termName}: ${definition.definition}\n\n"${definition.usage}"\n\n— ${definition.author || 'Anonymous'}\n\nFrom Floundermode Dictionary`;
  
  if (navigator.share) {
    navigator.share({
      title: `${termName} - Floundermode Dictionary`,
      text: shareText,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      // Show a brief success message
      const shareBtn = document.querySelector(`[data-def-id="${definitionId}"]`);
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = '✓';
      shareBtn.style.background = '#22c55e';
      shareBtn.style.color = 'white';
      
      setTimeout(() => {
        shareBtn.innerHTML = originalText;
        shareBtn.style.background = '';
        shareBtn.style.color = '';
      }, 1000);
    }).catch(err => {
      console.log('Error copying to clipboard:', err);
      alert('Share text copied to clipboard!');
    });
  }
}

// Share term function (for individual term pages)
function shareTerm(termName, definitions) {
  if (!definitions || definitions.length === 0) return;
  
  const primaryDef = definitions.find(def => def.isPrimary) || definitions[0];
  const shareText = `${termName}: ${primaryDef.definition}\n\n"${primaryDef.usage}"\n\n— ${primaryDef.author || 'Anonymous'}\n\nFrom Floundermode Dictionary`;
  
  if (navigator.share) {
    navigator.share({
      title: `${termName} - Floundermode Dictionary`,
      text: shareText,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Definition copied to clipboard!');
    }).catch(err => {
      console.log('Error copying to clipboard:', err);
      showToast('Share text copied to clipboard!');
    });
  }
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
  showToast
};

// Make functions globally available for HTML onclick handlers
window.shareDefinition = shareDefinition;
window.shareTerm = shareTerm;
