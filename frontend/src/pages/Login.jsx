import Card from '../components/ui/Card'
import LoginForm from '../components/auth/LoginForm'

const Login = () => {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border bg-gradient-to-br from-[#101018] via-[#141426] to-[#1f1a30] p-12 md:block">
        <div className="fade-slide-up relative z-10 max-w-md">
          <h1 className="font-display text-5xl italic leading-tight text-white">Send smarter. Reach further.</h1>
          <p className="mt-4 text-text-secondary">Craft one message. Deliver to many. Track every send from a single elegant workspace.</p>
        </div>
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -left-10 top-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>
      <div className="flex items-center justify-center bg-bg p-6">
        <Card className="fade-slide-up w-full max-w-md">
          <h2 className="mb-5 font-display text-3xl italic">Welcome Back</h2>
          <LoginForm />
        </Card>
      </div>
    </div>
  )
}

export default Login
