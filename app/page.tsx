import { readFile } from "fs/promises";
import path from "path";
import { ParentSignUpForm } from "@/components/ParentSignUpForm";

export default async function Home() {
  let termsContent = "";
  try {
    termsContent = await readFile(
      path.join(process.cwd(), "content/terms-and-conditions.md"),
      "utf-8"
    );
  } catch {
    termsContent = "*Terms and conditions could not be loaded.*";
  }

  return (
    <main className="page">
      <header className="page-header">
        <img
          src="https://res.cloudinary.com/njh101010/image/upload/v1772015902/brighterfutures/bft-logo-colour.png"
          alt="Brighter Futures Tutoring"
          className="page-header__logo"
        />
        <h2 className="page-header__title">New Starter Form</h2>
        <p>Please complete this form before tuition begins. All information will be kept confidential and stored securely.</p>
      </header>
      <ParentSignUpForm termsContent={termsContent} />
    </main>
  );
}
