import type { TrustData } from "@/types/cms";

export const defaults: TrustData = {
  eyebrow: "Who we are",
  heading: "Decades of cable accessories, made in India.",
  description:
    "As part of the Polycab group, Dowells supplies the lugs, glands, ferrules and connectors behind India's largest power, industrial and infrastructure projects — backed by rigorous testing labs and on-ground support.",
  certifications: [
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/home/trust/icon-iso.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "ISO 9001:2015",
    },
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/home/trust/icon-bis.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "BIS Certified",
    },
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/home/trust/icon-rohs.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "RoHS Compliant",
    },
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/home/trust/icon-made-in-india.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "Made in India",
    },
  ],
  stats: [
    { value: "55+", label: "Years of experience" },
    { value: "12K+", label: "Distributor network" },
    { value: "5,000+", label: "SKUs in catalogue" },
    { value: "40+", label: "Countries served" },
  ],
  image: {
    assetId: "",
    alt: "Electricity transmission towers at sunset",
    url: "/home/trust/side-transmission-towers.jpg",
    mimeType: "image/jpeg",
    fileType: "Image",
    fileSize: 0,
  },
};
