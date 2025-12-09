function loadSuggestions() {
  const songsList = document.getElementById("songsList");
  const tagsList = document.getElementById("tagsList");

  try {
    if (!chrome?.storage?.local) {
      throw new Error("chrome.storage.local is not available");
    }

    chrome.storage.local.get(["songs", "tags"], (result) => {
      const songs = result.songs || []; 
      const tags = result.tags || [];

      // Songs
      if (songs.length > 0) {
        songsList.innerHTML = songs.map(song => `<div class="song">${song}</div>`).join("");
      } else {
        songsList.innerHTML = "<em>No songs found</em>";
      }

      // Tags
      if (tags.length > 0) {
        tagsList.innerHTML = tags.map(tag => `<div class="tag">${tag}</div>`).join("");
      } else {
        tagsList.innerHTML = "<em>No tags found</em>";
      }
    });
  } catch (err) {
    console.error("❌ Error loading suggestions:", err);
    songsList.innerHTML = "<em>Error loading songs</em>";
    tagsList.innerHTML = "<em>Error loading tags</em>";
  }
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadSuggestions();
  document.getElementById("refreshBtn").addEventListener("click", loadSuggestions);
});
