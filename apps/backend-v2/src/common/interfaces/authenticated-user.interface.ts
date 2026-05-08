/**
 * Interface du contexte utilisateur authentifié (JWT payload validé).
 * Remplace `user: any` systémique dans tous les services et contrôleurs.
 */
export interface AuthenticatedUser {
  /** ID Prisma de l'utilisateur (champ `sub` du JWT) */
  userId: number;
  /** Email de l'utilisateur */
  email: string;
  /** Rôle : 'AS' (Super Admin) | 'AM' (Admin) */
  role: string;
  /** ID de l'instance active (premier espace géré, ou null) */
  instanceId: number | null;
  /** Liste de tous les IDs d'instances autorisées pour cet utilisateur */
  instanceIds: number[];
}
