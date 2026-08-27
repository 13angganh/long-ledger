export function AppVersion() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
  return (
    <p className="text-center text-xs text-text-tertiary">
      Long Ledger v{version}
    </p>
  );
}
