import { EAssetFileType } from "@models/asset/interface";

/**
 * Pure, dependency-free file-content inspectors. No Express, no I/O — safe to
 * unit test directly. The upload middleware (src/utils/middleware/upload.ts)
 * is the only caller.
 */

export const SVG_MAX_SIZE_BYTES = 200 * 1024; // 200KB

/** The result of detectAndValidateAssetFile — a file whose real type has
 *  been confirmed (by magic bytes, or by SVG content validation). */
export type AssetFileInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  fileType: EAssetFileType;
  fileSize: number;
};

export type DetectedBinaryFile = {
  mimeType: string;
  fileType: EAssetFileType;
};

const matchesBytes = (buffer: Buffer, bytes: number[], offset = 0): boolean => {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, i) => buffer[offset + i] === byte);
};

/**
 * Identifies a file purely from its magic bytes — never from the client's
 * declared mimetype/extension, which are trivially spoofable. Returns null
 * when the buffer doesn't match any allowed binary signature (per
 * API_CONTRACT §3: jpeg, png, webp, gif, mp4, webm, quicktime, pdf).
 */
export function detectBinaryFileType(buffer: Buffer): DetectedBinaryFile | null {
  // JPEG: FF D8 FF
  if (matchesBytes(buffer, [0xff, 0xd8, 0xff])) {
    return { mimeType: "image/jpeg", fileType: EAssetFileType.Image };
  }

  // PDF: "%PDF-"
  if (matchesBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return { mimeType: "application/pdf", fileType: EAssetFileType.Document };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: "image/png", fileType: EAssetFileType.Image };
  }

  // GIF: "GIF87a" or "GIF89a"
  if (
    matchesBytes(buffer, [0x47, 0x49, 0x46, 0x38]) &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { mimeType: "image/gif", fileType: EAssetFileType.Image };
  }

  // WEBP: "RIFF"<4-byte size>"WEBP"
  if (
    matchesBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    matchesBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { mimeType: "image/webp", fileType: EAssetFileType.Image };
  }

  // WebM / Matroska (EBML header): 1A 45 DF A3
  if (matchesBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { mimeType: "video/webm", fileType: EAssetFileType.Video };
  }

  // MP4 / QuickTime: ISO base media "ftyp" box at byte offset 4.
  if (buffer.length >= 12 && matchesBytes(buffer, [0x66, 0x74, 0x79, 0x70], 4)) {
    const majorBrand = buffer.subarray(8, 12).toString("ascii");
    if (majorBrand === "qt  ") {
      return { mimeType: "video/quicktime", fileType: EAssetFileType.Video };
    }
    return { mimeType: "video/mp4", fileType: EAssetFileType.Video };
  }

  return null;
}

export type SvgValidationResult = { valid: true } | { valid: false; reason: string };

const FORBIDDEN_SVG_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /<!DOCTYPE/i, reason: "DOCTYPE declarations are not allowed" },
  { pattern: /<!ENTITY/i, reason: "ENTITY declarations are not allowed" },
  { pattern: /<script[\s>]/i, reason: "<script> elements are not allowed" },
  {
    pattern: /<foreignObject[\s>]/i,
    reason: "<foreignObject> elements are not allowed",
  },
  {
    pattern: /\son[a-zA-Z]+\s*=/,
    reason: "event handler attributes (on*=) are not allowed",
  },
  { pattern: /javascript:/i, reason: "javascript: URIs are not allowed" },
  { pattern: /@import/i, reason: "CSS @import is not allowed" },
  {
    pattern: /url\(\s*['"]?(?:https?:)?\/\//i,
    reason: "external url() references are not allowed",
  },
];

const HREF_ATTR_PATTERN = /(?:xlink:href|href)\s*=\s*(["'])(.*?)\1/gi;

/**
 * Validates raw SVG text per API_CONTRACT §3 / asset-management skill: no
 * scripts, event handlers, foreignObject, DOCTYPE/ENTITY, or external
 * references (href/xlink:href/<use>/@import/url(http…)). A well-formed,
 * self-contained SVG passes; every listed attack pattern fails.
 */
export function validateSvgContent(text: string): SvgValidationResult {
  const content = text.replace(/^﻿/, ""); // strip BOM

  if (!/<svg[\s>]/i.test(content)) {
    return { valid: false, reason: "missing <svg> root element" };
  }

  for (const { pattern, reason } of FORBIDDEN_SVG_PATTERNS) {
    if (pattern.test(content)) {
      return { valid: false, reason };
    }
  }

  HREF_ATTR_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HREF_ATTR_PATTERN.exec(content))) {
    const value = match[2].trim();
    // Internal fragment references (e.g. href="#icon-id", used by <use>) are
    // fine; anything else is an external reference.
    if (value && !value.startsWith("#")) {
      return {
        valid: false,
        reason: "external href/xlink:href references are not allowed",
      };
    }
  }

  return { valid: true };
}

/** Decodes a buffer as strict UTF-8, returning null if it isn't valid UTF-8. */
export function decodeStrictUtf8(buffer: Buffer): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}
