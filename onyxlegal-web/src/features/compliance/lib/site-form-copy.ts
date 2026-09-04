/**
 * Every user-facing string on the add-a-site form.
 * Centralised so the honesty scan reads it.
 */
export const SITE_FORM_COPY = {
  title: 'Add a site',
  back: 'Back to sites',
  intro:
    'A location that holds its own licences. Only the name is required — '
    + 'the rest can be filled in later.',

  nameLabel: 'Site name',
  nameHint: 'What your team calls this location.',
  namePlaceholder: 'Riyadh HQ',
  cityLabel: 'City',
  codeLabel: 'Internal code',
  codeHint: 'Optional. Your own reference, if you use one.',
  addressLabel: 'Address',

  submit: 'Add this site',
  submitting: 'Adding…',
  cancel: 'Cancel',

  created: 'Site added',
  createdBody: 'You can attach licences to it now.',

  addCta: 'Add a site',
} as const;

export function allSiteFormCopy(): string[] {
  return Object.values(SITE_FORM_COPY).filter(
    (v): v is string => typeof v === 'string',
  );
}
