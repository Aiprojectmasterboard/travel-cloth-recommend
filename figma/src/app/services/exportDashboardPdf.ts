import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Capture a DOM element as a PNG image and trigger a download.
 */
export async function captureAsImage(
  target?: string | HTMLElement,
  filename?: string,
): Promise<Blob | null> {
  const el =
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target)
      : target ?? document.querySelector<HTMLElement>("[data-pdf-root]") ?? document.querySelector<HTMLElement>("main") ?? document.body;

  if (!el) return null;

  // Hide no-print elements
  const hidden: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>(".no-print").forEach((node) => {
    hidden.push(node);
    node.style.display = "none";
  });

  const scrollContainers: { el: HTMLElement; prev: string }[] = [];
  el.querySelectorAll<HTMLElement>("[style*='max-height'], [style*='overflow']").forEach((node) => {
    const prev = node.style.cssText;
    scrollContainers.push({ el: node, prev });
    node.style.maxHeight = "none";
    node.style.overflow = "visible";
  });

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#FDF8F3",
      logging: false,
      windowWidth: 1200,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png", 1.0)
    );

    if (blob && filename) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    return blob;
  } finally {
    hidden.forEach((node) => { node.style.display = ""; });
    scrollContainers.forEach(({ el: node, prev }) => { node.style.cssText = prev; });
  }
}

/**
 * Share the dashboard as an image via Web Share API, or download as fallback.
 */
export async function shareAsImage(
  target?: string | HTMLElement,
  title?: string,
): Promise<void> {
  const shareTitle = title || "My Travel Capsule AI Style Guide";
  const filename = `travel-capsule-${new Date().toISOString().slice(0, 10)}.png`;

  const blob = await captureAsImage(target);
  if (!blob) return;

  const file = new File([blob], filename, { type: "image/png" });

  // Try native Web Share API with file
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareTitle,
        files: [file],
      });
      return;
    } catch {
      // User cancelled or share failed — fall through to download
    }
  }

  // Fallback: download the image
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Extract a single quadrant from a grid image and download it.
 * quadrant: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
 */
export async function downloadQuadrantImage(
  imageUrl: string,
  quadrant: 0 | 1 | 2 | 3,
  filename: string,
): Promise<void> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
    });

    const halfW = Math.floor(img.naturalWidth / 2);
    const halfH = Math.floor(img.naturalHeight / 2);
    const sx = quadrant % 2 === 0 ? 0 : halfW;
    const sy = quadrant < 2 ? 0 : halfH;

    const canvas = document.createElement("canvas");
    canvas.width = halfW;
    canvas.height = halfH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, halfW, halfH, 0, 0, halfW, halfH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95)
    );
    if (!blob) return;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    // Fallback: open image in new tab
    window.open(imageUrl, "_blank");
  }
}

/**
 * Capture the visible dashboard content and export as a multi-page PDF.
 * Hides elements with `.no-print` class during capture.
 */
export async function exportDashboardPdf(
  /** CSS selector or element to capture. Defaults to main content area. */
  target?: string | HTMLElement,
  filename?: string,
): Promise<void> {
  const el =
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target)
      : target ?? document.querySelector<HTMLElement>("[data-pdf-root]") ?? document.querySelector<HTMLElement>("main") ?? document.body;

  if (!el) return;

  // Hide no-print elements
  const hidden: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>(".no-print").forEach((node) => {
    hidden.push(node);
    node.style.display = "none";
  });

  // Expand any collapsed/scrollable sections for full capture
  const scrollContainers: { el: HTMLElement; prev: string }[] = [];
  el.querySelectorAll<HTMLElement>("[style*='max-height'], [style*='overflow']").forEach((node) => {
    const prev = node.style.cssText;
    scrollContainers.push({ el: node, prev });
    node.style.maxHeight = "none";
    node.style.overflow = "visible";
  });

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#FDF8F3",
      logging: false,
      windowWidth: 1200,
    });

    // Calculate PDF pages from canvas
    const imgWidth = 210; // A4 mm
    const pageHeight = 297; // A4 mm
    const margin = 8; // mm
    const contentWidth = imgWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));

    const pdf = new jsPDF("p", "mm", "a4");

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // Create a sub-canvas for this page
      const pageCanvas = document.createElement("canvas");
      const ctx = pageCanvas.getContext("2d")!;
      const sourcePageHeight = (canvas.width * (pageHeight - margin * 2)) / contentWidth;
      const sourceY = page * sourcePageHeight;
      const sourceH = Math.min(sourcePageHeight, canvas.height - sourceY);

      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceH;
      ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);

      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.92);
      const renderHeight = (sourceH * contentWidth) / canvas.width;
      pdf.addImage(pageImgData, "JPEG", margin, margin, contentWidth, renderHeight);

      // Footer on every page
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        "Generated by TravelCapsule.com",
        imgWidth / 2,
        pageHeight - 4,
        { align: "center" },
      );
      pdf.text(
        `${page + 1} / ${totalPages}`,
        imgWidth - margin,
        pageHeight - 4,
        { align: "right" },
      );
    }

    const name = filename || `travel-capsule-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(name);
  } finally {
    // Restore hidden elements
    hidden.forEach((node) => {
      node.style.display = "";
    });
    // Restore scroll containers
    scrollContainers.forEach(({ el: node, prev }) => {
      node.style.cssText = prev;
    });
  }
}
