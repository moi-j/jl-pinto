/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  PagefindUI: new (options: Record<string, unknown>) => void;
}
