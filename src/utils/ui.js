/**
 * UI helpers (loading, errors)
 */

/**
 * Hide the loading indicator
 */
export function hideLoading() {
  const loading = document.getElementById("loading");
  if (loading) {
    loading.classList.add("hidden");
  }
}

/**
 * Show error message
 */
export function showError(message) {
  hideLoading();

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.innerHTML = `
    <h2>⚠️ Error Loading Model</h2>
    <p>${message}</p>
    <p>Make sure the FBX file exists at:</p>
    <p><code>./models/SLOW_QI.fbx</code></p>
  `;
  document.body.appendChild(errorDiv);
}
