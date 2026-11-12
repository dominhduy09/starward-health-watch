import ocularUrl from "@/assets/sample-ocular-ultrasound.jpg";
import rashUrl from "@/assets/sample-dermal-rash.jpg";

export interface SampleScan {
  id: string;
  label: string;
  sub: string;
  /** Bundled preview image. */
  url: string;
  /** What the crew member says when they attach it. */
  prompt: string;
}

export const SAMPLE_SCANS: SampleScan[] = [
  {
    id: "ocular",
    label: "Ocular Ultrasound Scan",
    sub: "Optic nerve sheath diameter — SANS check",
    url: ocularUrl,
    prompt:
      "Attached: ocular ultrasound, left eye sagittal view. The on-screen caliper reads an optic nerve sheath diameter of 5.4 mm. " +
      "Is this consistent with SANS or raised intracranial pressure, what does it mean for my vision, and what should I do now?",
  },
  {
    id: "rash",
    label: "Dermal Microgravity Rash Photo",
    sub: "Immune reactivation check",
    url: rashUrl,
    prompt:
      "Attached: photo of a rash on my forearm that appeared this morning — small red bumps, a few with tiny clear heads, mildly itchy, no fever. " +
      "Could this be shingles or another latent immune reactivation, and what should I do now?",
  },
];

/** A scan ready to be sent to the Copilot: a compact JPEG data URL plus its label. */
export interface ScanAttachment { label: string; dataUrl: string; }

/**
 * Normalise any image source (bundled sample URL or an uploaded file) into a
 * small JPEG data URL so the payload stays inside the gateway request budget.
 */
export async function toScanDataUrl(src: string | Blob, max = 768): Promise<string> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth || max, img.naturalHeight || max));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((img.naturalWidth || max) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || max) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}

export async function fileToScan(file: File): Promise<ScanAttachment> {
  return { label: `Uploaded capture — ${file.name}`, dataUrl: await toScanDataUrl(file) };
}

export async function sampleToScan(s: SampleScan): Promise<ScanAttachment> {
  return { label: `${s.label} (onboard sample)`, dataUrl: await toScanDataUrl(s.url) };
}
