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
    sub: "Simulation only · generated, not a clinical scan",
    url: ocularUrl,
    prompt:
      "Attached: simulation-only generated ocular ultrasound illustration. Any displayed caliper value is fictional and unvalidated. " +
      "Describe tentative qualitative features only; do not measure or diagnose. What should I record for flight-surgeon review before any treatment?",
  },
  {
    id: "rash",
    label: "Dermal Microgravity Rash Photo",
    sub: "Simulation only · generated, not a patient photo",
    url: rashUrl,
    prompt:
      "Attached: simulation-only generated rash illustration, not a patient photo. " +
      "Describe tentative qualitative features without diagnosing shingles or immune reactivation. What observations should be reviewed by the flight surgeon before treatment?",
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
  return { label: `Unvalidated uploaded capture — ${file.name}`, dataUrl: await toScanDataUrl(file) };
}

export async function sampleToScan(s: SampleScan): Promise<ScanAttachment> {
  return { label: `${s.label} (simulation only — generated, unvalidated)`, dataUrl: await toScanDataUrl(s.url) };
}
