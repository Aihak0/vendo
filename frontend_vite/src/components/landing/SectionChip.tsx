interface Props {
  children: React.ReactNode;
}

export default function SectionChip({ children }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3">
      {children}
    </span>
  );
}
