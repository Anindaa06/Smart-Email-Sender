import Card from '../components/ui/Card'
import RegisterForm from '../components/auth/RegisterForm'

const Register = () => {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-gradient-to-br from-[#101018] via-[#141426] to-[#1f1a30] p-12 md:block">
        <div className="fade-slide-up relative z-10 max-w-md">
          <h1 className="font-display text-5xl italic leading-tight text-white">Join the smarter way to email.</h1>
          <p className="mt-4 text-text-secondary">Secure SMTP vault, rapid recipient workflows, and powerful delivery logs in one place.</p>
        </div>
        <div className="absolute -bottom-10 right-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -left-12 top-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>
      <div className="flex items-center justify-center bg-bg p-6">
        <Card className="fade-slide-up w-full max-w-md">
          <h2 className="mb-5 font-display text-3xl italic">Create Account</h2>
          <RegisterForm />
        </Card>
      </div>
    </div>
  )
}

export default Register
