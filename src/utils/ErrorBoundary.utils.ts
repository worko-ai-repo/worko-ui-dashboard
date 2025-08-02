import { UserRole } from "@Interfaces/RoleBasedAccessControl";

export class UnauthorizedAccessError extends Error {
	public Navto?: string;

	constructor(message : UserRole) {
		super(message);
		this.name = 'UnauthorizedAccessError';
	}
}
