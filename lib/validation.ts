import { Project, SettingsData } from './content';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProjects(projects: any[]): ValidationResult {
  const errors: string[] = [];
  if (!Array.isArray(projects)) {
    return { valid: false, errors: ['Projects content must be an array.'] };
  }

  const seenIds = new Set<string>();

  projects.forEach((proj, idx) => {
    const id = proj.id || proj.slug;
    if (!id) {
      errors.push(`Project at index ${idx} is missing an ID or slug.`);
    } else if (seenIds.has(id)) {
      errors.push(`Duplicate project ID/slug detected: "${id}".`);
    } else {
      seenIds.add(id);
    }

    if (!proj.title || typeof proj.title !== 'string' || proj.title.trim().length === 0) {
      errors.push(`Project "${id || idx}" has an empty or missing title.`);
    }

    if (!proj.category) {
      errors.push(`Project "${id || idx}" must have a category.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSettings(settings: any): ValidationResult {
  const errors: string[] = [];
  if (!settings || typeof settings !== 'object') {
    return { valid: false, errors: ['Settings must be a valid JSON object.'] };
  }

  if (!settings.profile?.name) {
    errors.push('Site settings must define profile.name.');
  }

  if (settings.connect?.email && !settings.connect.email.includes('@')) {
    errors.push('Contact email is invalid.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAllContent(contentMap: {
  projects?: any;
  settings?: any;
}): ValidationResult {
  const allErrors: string[] = [];

  if (contentMap.projects) {
    const res = validateProjects(contentMap.projects);
    if (!res.valid) allErrors.push(...res.errors);
  }

  if (contentMap.settings) {
    const res = validateSettings(contentMap.settings);
    if (!res.valid) allErrors.push(...res.errors);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
