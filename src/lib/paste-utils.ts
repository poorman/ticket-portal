/**
 * Handle paste events that may contain rich HTML with images (e.g. from Gmail).
 * Extracts plain text and inline images, converting external image URLs to base64.
 *
 * Returns { text, images } where text has {{img:N}} placeholders for inline images.
 * Returns null if no special handling was needed (plain text paste).
 */
export async function handleRichPaste(
  e: React.ClipboardEvent,
  existingImages: string[]
): Promise<{ text: string; images: string[] } | null> {
  const clipboard = e.clipboardData;
  if (!clipboard) return null;

  // Check for direct image file paste (screenshot)
  for (const item of clipboard.items) {
    if (item.type.startsWith('image/') && item.kind === 'file') {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      const base64 = await fileToBase64(file);
      const newImages = [...existingImages, base64];
      const placeholder = `{{img:${newImages.length}}}`;
      return { text: placeholder + '\n', images: newImages };
    }
  }

  // Check for HTML content (Gmail, Outlook, etc.)
  const html = clipboard.getData('text/html');
  if (!html || !html.includes('<img')) return null;

  e.preventDefault();

  // Parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract text and images in order
  const newImages = [...existingImages];
  let resultText = '';

  async function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      resultText += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'img') {
        const src = el.getAttribute('src') || '';
        if (src) {
          try {
            const base64 = await imgSrcToBase64(src);
            if (base64) {
              newImages.push(base64);
              resultText += `{{img:${newImages.length}}}`;
              return;
            }
          } catch {
            // If we can't convert, skip the image
          }
        }
        return;
      }

      // Block elements get newlines
      const blockTags = ['p', 'div', 'br', 'tr', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];
      if (blockTags.includes(tag) && resultText.length > 0 && !resultText.endsWith('\n')) {
        resultText += '\n';
      }

      for (const child of node.childNodes) {
        await processNode(child);
      }

      if (blockTags.includes(tag) && !resultText.endsWith('\n')) {
        resultText += '\n';
      }
    }
  }

  await processNode(doc.body);

  // Clean up excessive whitespace
  resultText = resultText.replace(/\n{3,}/g, '\n\n').trim();

  return { text: resultText, images: newImages };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function imgSrcToBase64(src: string): Promise<string | null> {
  // Already base64
  if (src.startsWith('data:')) return src;

  // Try to fetch and convert external URLs via canvas
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      // Try with proxy to avoid CORS — fallback to direct
      img.src = src;
      // Timeout after 5s
      setTimeout(() => resolve(null), 5000);
    });
  } catch {
    return null;
  }
}
