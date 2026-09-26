"use client";

import { useRef, useState } from "react";
import type { ResolvedMedia, Asset } from "@/types/cms";
import type { FieldProps } from "../types";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Input";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { useToast } from "@/components/admin/ui/Toast";
import { uploadAssetBrowser, replaceAssetBrowser } from "@/lib/api/assets.client";
import { ApiError } from "@/lib/api/error";
import { formatFileSize, fileTypeLabel } from "@/lib/format";
import { fieldDomId } from "../path";
import { FieldError } from "./shared";
import { acceptToInputAttr, maxSizeBytes } from "./mediaAccept";

/**
 * `ResolvedMedia` plus the upload response's `originalName`, kept around
 * only in this field's own state for the Document preview — the contract's
 * `ResolvedMedia` (what a page GET returns) doesn't carry it, so it's only
 * ever available right after an upload/replace in this session.
 */
type ResolvedMediaWithName = (NonNullable<ResolvedMedia> & { originalName?: string }) | null;

function toResolved(asset: Asset, alt: string): ResolvedMediaWithName {
  return {
    assetId: asset.assetId,
    alt,
    url: asset.url,
    mimeType: asset.mimeType,
    fileType: asset.fileType,
    fileSize: asset.fileSize,
    originalName: asset.originalName,
  };
}

/**
 * THE media editor: a file is uploaded straight from the admin's computer
 * (or overwritten in place) and referenced by its assetId. There is no
 * asset library — every field owns its own upload.
 */
export function MediaField({ field, value, onChange, path, errors }: FieldProps) {
  const toast = useToast();

  const [uploading, setUploading] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const pendingReplaceFile = useRef<File | null>(null);

  if (field.kind !== "media") return null;
  const media = (value ?? null) as ResolvedMediaWithName;
  const id = fieldDomId(path);
  const altLabel = field.accept === "document" ? "Alt text / title" : "Alt text";
  const errorId = `${id}-error`;
  const error = errors[path];

  async function handleUploadFile(file: File) {
    const max = maxSizeBytes(file.type);
    if (file.size > max) {
      toast.show(`"${file.name}" is larger than the ${Math.round(max / 1024)} KB limit — trying anyway.`, "error");
    }
    setUploading(true);
    try {
      const { asset } = await uploadAssetBrowser(file);
      onChange(toResolved(asset, media?.alt ?? ""));
      toast.show("Uploaded", "success");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleReplaceConfirmed() {
    const file = pendingReplaceFile.current;
    if (!file || !media?.assetId) return;
    setUploading(true);
    try {
      const { asset } = await replaceAssetBrowser(media.assetId, file);
      onChange(toResolved(asset, media.alt));
      toast.show("Replaced", "success");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Replace failed", "error");
    } finally {
      setUploading(false);
      setConfirmReplace(false);
      pendingReplaceFile.current = null;
    }
  }

  return (
    <div id={id} tabIndex={-1} className="focus:outline-none">
      <label htmlFor={`${id}-alt`} className="mb-1.5 block text-sm font-medium text-ink">
        {field.label}
      </label>
      {field.help && <p className="mb-1.5 text-xs text-grey-500">{field.help}</p>}

      <div className="flex items-start gap-3 rounded-md border border-grey-200 p-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-grey-100">
          {!media && <span className="px-1 text-center text-[10px] text-grey-400">No media</span>}
          {media?.fileType === "Video" && (
            <video src={media.url} muted className="h-full w-full object-cover" />
          )}
          {media?.fileType === "Image" && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary/versioned asset url, admin-only
            <img
              src={media.url}
              alt={media.alt}
              className={`h-full w-full ${media.mimeType === "image/svg+xml" ? "object-contain p-2" : "object-cover"}`}
            />
          )}
          {media?.fileType === "Document" && (
            <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-7 w-7 text-grey-400"
              >
                <path
                  d="M6 2h8l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
                  strokeLinejoin="round"
                />
                <path d="M14 2v5h5" strokeLinejoin="round" />
              </svg>
              {media.originalName && (
                <span
                  className="w-full truncate text-[9px] text-grey-500"
                  title={media.originalName}
                >
                  {media.originalName}
                </span>
              )}
              <span className="text-[9px] text-grey-400">
                {formatFileSize(media.fileSize)} · {fileTypeLabel(media.mimeType)}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-alt`} className="mb-1 block text-xs font-medium text-grey-500">
            {altLabel}
          </label>
          <Input
            id={`${id}-alt`}
            value={media?.alt ?? ""}
            disabled={!media}
            onChange={(e) => media && onChange({ ...media, alt: e.target.value })}
            placeholder="Describe this media for accessibility"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button type="button" size="sm" variant="secondary" loading={uploading} onClick={() => uploadInputRef.current?.click()}>
              Upload new
            </Button>
            {media && (
              <Button type="button" size="sm" variant="secondary" onClick={() => replaceInputRef.current?.click()}>
                Replace file in place
              </Button>
            )}
            {media && (
              <Button type="button" size="sm" variant="danger" onClick={() => onChange(null)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept={acceptToInputAttr(field.accept)}
        className="sr-only"
        aria-label={`Upload new file for ${field.label}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleUploadFile(file);
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={acceptToInputAttr(field.accept)}
        className="sr-only"
        aria-label={`Replace file for ${field.label}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) {
            pendingReplaceFile.current = file;
            setConfirmReplace(true);
          }
        }}
      />

      <FieldError id={errorId} message={error} />

      <ConfirmDialog
        open={confirmReplace}
        title="Replace file in place"
        message="This overwrites the current file immediately, even before you save the section. This cannot be undone."
        confirmLabel="Replace"
        danger
        loading={uploading}
        onConfirm={handleReplaceConfirmed}
        onCancel={() => {
          setConfirmReplace(false);
          pendingReplaceFile.current = null;
        }}
      />
    </div>
  );
}
