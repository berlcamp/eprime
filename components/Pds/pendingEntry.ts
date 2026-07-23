/**
 * The list-style PDS tabs carry two independent forms: the "Add" form pushes a
 * row into the list, and "Save Changes" writes the list. Someone who filled in
 * the Add fields and went straight to Save used to be told "Successfully saved"
 * while the row they had just typed was dropped on the floor.
 */
export const hasPendingEntry = (values: Record<string, any>) =>
  Object.values(values).some((value) =>
    typeof value === 'string' ? value.trim() !== '' : Boolean(value)
  )

export const pendingEntryMessage =
  'Not saved — you have an unfinished entry. Click Add to include it (or Cancel to discard it), then Save.'
