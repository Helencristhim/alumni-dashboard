// Exporta todos os hooks
export { useAuth, type AuthUser } from './useAuth';
export {
  usePermissions,
  useHasPermission,
  useCanAccessModule,
  withPermission,
  checkUserPermission,
} from './usePermissions.js';
