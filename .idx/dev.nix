{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  # Estensioni allineate a WF-QUAL-01 STEP 3: consumano config del repo (Biome + Deno edge).
  # Non reintrodurre ESLint/Prettier/Svelte/Vue come toolchain parallela.
  idx.extensions = [
    "biomejs.biome"
    "denoland.vscode-deno"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
