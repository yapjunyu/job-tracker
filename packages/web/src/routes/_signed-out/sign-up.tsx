import { createFileRoute, Link } from "@tanstack/react-router";
import { signUp } from "@/api/auth";
import { AccountForm } from "@/components/account-form";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/_signed-out/sign-up")({ component: SignUp });

function SignUp() {
  return (
    <AccountForm
      title="Create your account"
      action="Create account"
      newPassword
      submit={signUp}
      switchForm={
        <>
          Already have an account?{" "}
          <Link to="/sign-in" className={buttonVariants({ variant: "link", className: "px-0" })}>
            Sign in
          </Link>
        </>
      }
    />
  );
}
