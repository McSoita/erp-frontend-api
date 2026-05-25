export const ROLE_MODULE_ACCESS = {
  Admin: {
    Finance: 'write',
    BI: 'write',
    CRM: 'write',
    Inventory: 'write',
    SCM: 'write',
    'Sales Orders': 'write',
    HR: 'write',
  },
  Accountant: {
    Finance: 'write',
  },
  Auditor: {
    BI: 'write',
    CRM: 'read',
    Inventory: 'read',
    SCM: 'read',
    'Sales Orders': 'read',
    HR: 'read',
  },
  'Sales executive': {
    BI: 'write',
    SCM: 'write',
    'Sales Orders': 'write',
    CRM: 'write',
  },
  'Human Resource': {
    HR: 'write',
  },
  'Inventory Manager': {
    Inventory: 'write',
    SCM: 'write',
  },
  'Logistics manager': {
    'Sales Orders': 'write',
    SCM: 'write',
    Inventory: 'read',
  },
  'Warehouse manager': {
    Inventory: 'write',
  },
  'Junior sales': {
    'Sales Orders': 'write',
  },
}

export const ROLE_OPTIONS = Object.keys(ROLE_MODULE_ACCESS)

const CANONICAL_ROLE_NAME_LOOKUP = Object.fromEntries(
  ROLE_OPTIONS.map((roleName) => [roleName.toLowerCase(), roleName]),
)

const ROLE_NAME_ALIASES = {
  'executive board': 'Auditor',
  superadmin: 'Admin',
  'super administrator': 'Admin',
  'sales viewer': 'Junior sales',
  'sales manager': 'Sales executive',
  'sales representative': 'Junior sales',
  'customer support': 'Junior sales',
  'finance controller': 'Accountant',
  'financial auditor': 'Auditor',
  'hr director': 'Human Resource',
  'hr assistant': 'Human Resource',
  'logistics coordinator': 'Logistics manager',
}

const LEGACY_ROLE_ID_ALIASES = {
  1: 'Admin',
  2: 'Junior sales',
  113: 'Admin',
  114: 'Auditor',
  115: 'Sales executive',
  116: 'Junior sales',
  117: 'Junior sales',
  118: 'Warehouse manager',
  119: 'Logistics manager',
  120: 'Human Resource',
  121: 'Human Resource',
  122: 'Accountant',
  123: 'Auditor',
}

const MODULE_NAME_ALIASES = {
  finance: 'Finance',
  bi: 'BI',
  crm: 'CRM',
  inventory: 'Inventory',
  scm: 'SCM',
  hr: 'HR',
  sales: 'Sales Orders',
  'sales orders': 'Sales Orders',
  salesorders: 'Sales Orders',
}

export function normalizeRoleName(role) {
  if (role == null) {
    return null
  }

  if (typeof role === 'number') {
    return LEGACY_ROLE_ID_ALIASES[role] ?? null
  }

  const normalizedValue = String(role).trim()

  if (!normalizedValue) {
    return null
  }

  if (ROLE_MODULE_ACCESS[normalizedValue]) {
    return normalizedValue
  }

  if (/^\d+$/.test(normalizedValue)) {
    return LEGACY_ROLE_ID_ALIASES[Number(normalizedValue)] ?? null
  }

  const normalizedLookupValue = normalizedValue.toLowerCase()

  return (
    CANONICAL_ROLE_NAME_LOOKUP[normalizedLookupValue] ??
    ROLE_NAME_ALIASES[normalizedLookupValue] ??
    null
  )
}

export function resolveUserRole(user) {
  if (!user) {
    return null
  }

  return normalizeRoleName(
    user.role ??
      user.role_name ??
      user.roleName ??
      user.role_id ??
      user.roleId,
  )
}

function normalizeModuleName(moduleName) {
  const normalizedValue = String(moduleName ?? '').trim()

  if (!normalizedValue) {
    return null
  }

  return MODULE_NAME_ALIASES[normalizedValue.toLowerCase()] ?? normalizedValue
}

export function hasModuleAccess(role, moduleName) {
  const resolvedRole =
    typeof role === 'object' ? resolveUserRole(role) : normalizeRoleName(role)
  const resolvedModuleName = normalizeModuleName(moduleName)

  if (!resolvedRole || !resolvedModuleName) {
    return false
  }

  return Boolean(ROLE_MODULE_ACCESS[resolvedRole]?.[resolvedModuleName])
}

export function canWrite(role, moduleName) {
  const resolvedRole =
    typeof role === 'object' ? resolveUserRole(role) : normalizeRoleName(role)
  const resolvedModuleName = normalizeModuleName(moduleName)

  if (!resolvedRole || !resolvedModuleName) {
    return false
  }

  return ROLE_MODULE_ACCESS[resolvedRole]?.[resolvedModuleName] === 'write'
}
