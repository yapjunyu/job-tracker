import { createFileRoute, Link } from "@tanstack/react-router";
import { signIn } from "@/api/auth";
import { AccountForm } from "@/components/account-form";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/_signed-out/sign-in")({ component: SignIn });

function SignIn() {
  return (
    <AccountForm
      title="Sign in"
      action="Sign in"
      newPassword={false}
      submit={signIn}
      switchForm={
        <>
          New to job-tracker?{" "}
          <Link to="/sign-up" className={buttonVariants({ variant: "link", className: "px-0" })}>
            Create an account
          </Link>
        </>
      }
    />
  );
}
