import type { FieldErrors } from 'react-hook-form'

/**
 * react-hook-form's handleSubmit silently refuses to run the submit handler
 * when any registered field fails validation. If that field's error message
 * isn't rendered — or is rendered far above the Save button — clicking Save
 * looks like it did nothing at all, which users report as "it won't save".
 *
 * Pass this as handleSubmit's second (onInvalid) argument so a blocked submit
 * always tells the user why.
 */
export const notifyInvalid =
  (setToast: (type: string, message: string) => void) =>
  (errors: FieldErrors) => {
    const count = Object.keys(errors).length

    setToast(
      'error',
      count > 1
        ? `Not saved — ${count} fields need your attention. Please review the fields marked in red.`
        : 'Not saved — a required field is missing or invalid. Please review the field marked in red.'
    )
  }
