"use client";

type Action = (formData: FormData) => void | Promise<void>;

export function DeleteForm({
  action,
  id,
  label = "Delete",
  confirmMessage = "Are you sure? This can't be undone.",
  className = "btn-danger",
}: {
  action: Action;
  id: string;
  label?: string;
  confirmMessage?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
