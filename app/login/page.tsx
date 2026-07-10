import Background from "./components/Background";
import LeftPanel from "./components/LeftPanel";
import LoginForm from "./components/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">

      <Background />

      <div className="relative z-10 flex min-h-screen">

        <LeftPanel />

        <LoginForm />

      </div>

    </main>
  );
}