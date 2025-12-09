console.log("👁️ Tags-Songs-Suggester content script loaded");

const observer = new MutationObserver(() => {
  const site = window.location.hostname;
  let fileInput = null;

  if (site.includes("instagram.com")) {
    fileInput = document.querySelector('input[type="file"]');
  } else if (site.includes("youtube.com")) {
    fileInput = document.querySelector('input[type="file"]');
  } else if (site.includes("twitter.com")) {
    fileInput = document.querySelector('input[type="file"][accept*="image"]');
  } else if (site.includes("linkedin.com")) {
    fileInput = document.querySelector('input[type="file"]');
  }

  if (fileInput && !fileInput.classList.contains("suggester-hooked")) {
    console.log("📂 File input detected on", site);
    fileInput.classList.add("suggester-hooked");

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        console.log("📸 File change detected");
        console.log("🖼️ Selected file:", file.name);

        const reader = new FileReader();

        reader.onload = async function () {
          const base64Image = reader.result.split(',')[1];
          console.log("🧠 Sending image to backend...");

          try {
            const res = await fetch("http://localhost:5000/analyze", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image: base64Image }),
            });

            if (!res.ok) {
              console.error("❌ Server returned error:", res.status);
              return;
            }

            const data = await res.json();
            console.log("✅ Received response:", data);

            if (chrome?.storage?.local) {
              chrome.storage.local.set({
                tags: data.tags,
                songs: data.songs
              }, () => {
                console.log("📦 Tags & Songs stored from", site);
              });
            } else {
              console.error("❌ chrome.storage.local is undefined!");
            }

          } catch (err) {
            console.error("❌ Error sending image to backend:", err);
          }
        };

        reader.readAsDataURL(file);
      } else {
        console.warn("⚠️ Not an image file or no file selected.");
      }
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// 🔁 Fallback interval check (in case MutationObserver misses)
setInterval(() => {
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput && !fileInput.classList.contains("suggester-hooked")) {
    console.log("🕵️ Hooking file input via fallback interval");
    fileInput.classList.add("suggester-hooked");

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        console.log("📸 File change detected via fallback");
        const reader = new FileReader();

        reader.onload = async function () {
          const base64Image = reader.result.split(',')[1];
          try {
            const res = await fetch("http://localhost:5000/analyze", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image: base64Image }),
            });

            const data = await res.json();

            if (chrome?.storage?.local) {
              chrome.storage.local.set({
                tags: data.tags,
                songs: data.songs
              }, () => {
                console.log("📦 Tags & Songs stored (fallback)");
              });
            } else {
              console.error("❌ chrome.storage.local is undefined!");
            }

          } catch (err) {
            console.error("❌ Fallback error:", err);
          }
        };

        reader.readAsDataURL(file);
      }
    });
  }
}, 3000);
