// Renders a Material Symbols glyph by its exact name — the same icon set the
// Flutter app uses (e.g. Icons.inventory_2_outlined → name "inventory_2").
export function MIcon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`mso ${className}`}
      style={{ fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}
