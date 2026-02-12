import { getSession } from "~/server/better-auth/server";
import { Header } from "./header";

export async function HeaderServer() {
  const session = await getSession();
  return <Header session={session} />;
}
