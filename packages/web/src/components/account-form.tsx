import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Credentials } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface AccountFormProps {
  title: string;
  /** What the submit button says. */
  action: string;
  /** Signing up asks for a new password, which password managers can offer to generate. */
  newPassword: boolean;
  /** Signs someone in, or rejects with the message to show them. */
  submit: (credentials: Credentials) => Promise<void>;
  /** A way to the other form: from sign-in to sign-up, or back. */
  switchForm: ReactNode;
}

/** A page with an email and password form that opens the app once someone is signed in. */
export function AccountForm({ title, action, newPassword, submit, switchForm }: AccountFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const submission = useMutation({
    mutationFn: async (credentials: Credentials) => {
      await submit(credentials);
      // Nothing cached from before belongs to whoever is signed in now.
      queryClient.removeQueries();
      await navigate({ to: "/" });
    },
  });

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">job-tracker</p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const text = (name: string) => {
              const value = form.get(name);
              return typeof value === "string" ? value : "";
            };
            submission.mutate({ email: text("email"), password: text("password") });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={newPassword ? "new-password" : "current-password"}
                minLength={newPassword ? 8 : undefined}
                required
              />
              {newPassword && <FieldDescription>At least 8 characters.</FieldDescription>}
            </Field>
            {submission.error && <FieldError>{submission.error.message}</FieldError>}
            <Button type="submit" size="lg" disabled={submission.isPending}>
              {action}
            </Button>
          </FieldGroup>
        </form>
        <p className="text-sm text-muted-foreground">{switchForm}</p>
      </div>
    </main>
  );
}
