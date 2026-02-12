import { redirect } from "next/navigation";
import { Plus, TicketCheck } from "lucide-react";

import { getSession } from "~/server/better-auth/server";
import { Card } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Leagues</h1>
        <Button>
          <Plus className="h-4 w-4" />
          Create League
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
              <TicketCheck className="h-6 w-6 text-text-muted" />
            </div>
            <div>
              <p className="font-medium text-text-secondary">No leagues yet</p>
              <p className="mt-1 text-sm text-text-muted">
                Create one or join with an invite link.
              </p>
            </div>
          </div>
        </Card>

        <Card header="Join a League">
          <form className="flex flex-col gap-3">
            <Input
              id="invite-code"
              placeholder="Paste invite code..."
              description="Get an invite code from a league admin"
            />
            <Button variant="secondary" className="self-start">
              Join League
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
