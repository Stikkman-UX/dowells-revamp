import type { Field } from "@/components/admin/form/types";

export const formConfig: Field[] = [
  { name: "title", label: "Title", kind: "text", maxLength: 200 },
  {
    name: "caption",
    label: "Caption",
    kind: "text",
    maxLength: 200,
    help: "Free text shown under the title, e.g. edition and page count. The file size is derived automatically.",
  },
  {
    name: "file",
    label: "Catalogue PDF",
    kind: "media",
    accept: "document",
    help: "PDF only",
  },
  {
    name: "button",
    label: "Download button",
    kind: "button",
    help: "The link is ignored — the uploaded PDF is used. Text and icon apply.",
  },
];
