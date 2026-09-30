// Session/User type augmentation: expose the DB id and role on the session.
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & NonNullable<import("next-auth").DefaultSession["user"]>;
  }
  interface User {
    role: string;
  }
}
