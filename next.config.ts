import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => "build-" + Date.now(),
  // Friendly addresses people (and testers) naturally guess, sent to the
  // real page instead of a "not found" dead end. Temporary (307) so they
  // can be renamed later without browsers remembering them forever.
  async redirects() {
    return [
      { source: '/quests', destination: '/activities', permanent: false },
      { source: '/quest-library', destination: '/activities', permanent: false },
      { source: '/data-retention', destination: '/retention', permanent: false },
      { source: '/privacy-policy', destination: '/privacy', permanent: false },
      { source: '/map', destination: '/play', permanent: false },
      { source: '/world', destination: '/play', permanent: false },
      { source: '/parent', destination: '/family', permanent: false },
      { source: '/parents', destination: '/family', permanent: false },
      { source: '/parent-zone', destination: '/family', permanent: false },
      // game names people type or remember (Muse round 4)
      { source: '/play/word-wizard', destination: '/play/reading', permanent: false },
      { source: '/play/maze-runner', destination: '/play/fine-motor', permanent: false },
      { source: '/play/sense-explorer', destination: '/play/sensory', permanent: false },
      { source: '/play/math', destination: '/play/snack-quest', permanent: false },
      { source: '/play/wheres-noel', destination: '/play/hidden-friends', permanent: false },
      { source: '/print', destination: '/printables', permanent: false },
      { source: '/premium', destination: '/upgrade', permanent: false },
      { source: '/assessment', destination: '/setup', permanent: false },
    ];
  },
};

export default nextConfig;
