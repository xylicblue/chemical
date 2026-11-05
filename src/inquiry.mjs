import { validateInquiry } from './model.mjs';

export function createInquiryPayload(formData) {
  const fields = Object.fromEntries(formData);
  const consent = formData.has('consent');
  const details = validateInquiry({ ...fields, consent });
  return { ...details, consent, website: fields.website || '' };
}
