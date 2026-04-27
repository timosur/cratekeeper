export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-8 py-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        <p className="text-sm text-neutral-500">
          {description ?? "This section will be implemented in a later milestone."}
        </p>
      </div>
    </div>
  );
}
