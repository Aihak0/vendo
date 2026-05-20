import PageMeta from "../../components/common/PageMeta";
// import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Vendo SignIn "
        description="This is React.js SignIn Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="min-h-scree p-8 bg-red-900">

      </div>
        <SignInForm />

    </>
  );
}
