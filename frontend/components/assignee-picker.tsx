import type { ProjectMember } from "@/types/api";

export function AssigneePicker({
  members,
  selectedIds,
  onChange,
  disabled = false,
}: {
  members: ProjectMember[];
  selectedIds: string[];
  onChange: (userIds: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 block text-sm font-medium text-foreground">
        Assignees
      </legend>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
        {members.map(({ user }) => (
          <label
            key={user.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-surface-secondary"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(user.id)}
              onChange={(event) => {
                onChange(
                  event.target.checked
                    ? [...selectedIds, user.id]
                    : selectedIds.filter((id) => id !== user.id),
                );
              }}
            />
            <span className="truncate">{user.name}</span>
          </label>
        ))}
        {members.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted">No project members available.</p>
        ) : null}
      </div>
      <p className="text-xs text-muted">Select one or more project members.</p>
    </fieldset>
  );
}
