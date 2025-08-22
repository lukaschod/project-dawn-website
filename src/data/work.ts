import jobIconRaw from '../assets/icons/job-title-icon.svg?raw';
import companyIconRaw from '../assets/icons/company-icon.svg?raw';
import locationIconRaw from '../assets/icons/location-icon.svg?raw';
import { sanitizeToOutline } from '../lib/svg';

export const workIcons = {
  job: sanitizeToOutline(jobIconRaw, 15),
  company: sanitizeToOutline(companyIconRaw, 15),
  location: sanitizeToOutline(locationIconRaw, 15),
};

export const work = [
  {
    title: "Founder",
    company: "Project Dawn",
    region: "Vilnius",
    description:
      "Developed and published over 9 commercial Asset Store packages. Completed contract work with 3 different studios. Currently developing an independent game.",
    technologies: [
      "Unity Engine",
      "HLSL",
      "C#",
      "HPC#",
      "Python",
      "ECS",
      "Discord",
    ],
  },
  {
    title: "Senior Graphics Engineer",
    company: "Huawei Ireland Research Center",
    region: "Dublin (Remote)",
    description:
      "Developed a WebGPU implementation for Huawei’s technology stack.",
    technologies: [
      "WebGPU",
      "Vulkan",
      "C++",
    ],
  },
  {
    title: "Senior Graphics Engineer",
    company: "SneakyBox",
    region: "Kaunas (Remote)",
    description:
      "Ported Warhammer 40,000: Space Marine from DirectX 9 to DirectX 12.",
    technologies: [
      "Phoenix Engine",
      "DirectX 12",
      "C",
    ],
  },
  {
    title: "Software Developer",
    company: "Hedra",
    region: "San Francisco (Remote)",
    description:
      "Developed an advanced editor tool using the Bevy engine with ECS (Entity Component System) architecture, implemented in Rust. Focused primarily on the graphics pipeline, leveraging WebGPU for rendering.",
    technologies: [
      "Bevy Engine",
      "WebGPU",
      "wgpu",
      "Rust",
      "ECS",
    ],
  },
  {
    title: "Senior Developer",
    company: "No Brakes Games",
    region: "Vilnius (Hybrid)",
    description:
      "Developed tools for Human: Fall Flat 2.",
    technologies: [
      "Unity Engine",
      "High-Definition Render Pipeline",
      "C#",
    ],
  },
  {
    title: "Senior Graphics Engineer",
    company: "Unity",
    region: "Copenhagen (Remote)",
    description:
      "Worked on Unity’s high-level graphics render pipeline, Universal Render Pipeline. Implemented a high-performance decal system with multiple backends for specific platforms.",
    technologies: [
      "Unity Engine",
      "Universal Render Pipeline",
      "C#",
    ],
  },
  {
    title: "Software Developer",
    company: "Unity",
    region: "Vilnius",
    description:
      "Maintained mobile graphics platforms, which included fixing bugs and implementing feature requests from Apple. Implemented Local Keywords in Unity, a crucial feature for Asset Store developers and SRP.",
    technologies: [
      "Unity Engine",
      "C/C++",
      "DirectX 11",
      "DirectX 12",
      "Metal",
    ],
  },
];

export type WorkItem = (typeof work)[number];

