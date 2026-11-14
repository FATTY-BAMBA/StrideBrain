export type DataMode = "DEMO_SYNTHETIC";
export type PublicEnvironment = "development" | "preview" | "production";

export type ServerEnvironment = {
  dataMode: DataMode;
  publicEnvironment: PublicEnvironment;
  appOrigin: URL;
};

const publicEnvironments = new Set<PublicEnvironment>(["development", "preview", "production"]);

export function parseServerEnvironment(
  input: Record<string, string | undefined>,
): ServerEnvironment {
  const dataMode = input.STRIDEBRAIN_DATA_MODE ?? "DEMO_SYNTHETIC";
  if (dataMode !== "DEMO_SYNTHETIC") {
    throw new Error(
      "Stage 0 supports STRIDEBRAIN_DATA_MODE=DEMO_SYNTHETIC only. Real tenant data is not authorized.",
    );
  }

  const rawPublicEnvironment = input.NEXT_PUBLIC_STRIDEBRAIN_ENV ?? "development";
  if (!publicEnvironments.has(rawPublicEnvironment as PublicEnvironment)) {
    throw new Error("NEXT_PUBLIC_STRIDEBRAIN_ENV must be development, preview, or production.");
  }

  const rawOrigin = input.STRIDEBRAIN_APP_ORIGIN ?? "http://localhost:3000";
  let appOrigin: URL;
  try {
    appOrigin = new URL(rawOrigin);
  } catch {
    throw new Error("STRIDEBRAIN_APP_ORIGIN must be a valid absolute URL.");
  }

  if (!new Set(["http:", "https:"]).has(appOrigin.protocol)) {
    throw new Error("STRIDEBRAIN_APP_ORIGIN must use http or https.");
  }

  return {
    dataMode,
    publicEnvironment: rawPublicEnvironment as PublicEnvironment,
    appOrigin,
  };
}

export function getServerEnvironment(): ServerEnvironment {
  return parseServerEnvironment(process.env);
}
