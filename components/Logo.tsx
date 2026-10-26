export function Logo({ className, alt = "ADO Den Haag" }: { className?: string; alt?: string }) {
  return <img className={className} src="/ado/logo.svg" alt={alt} />;
}
