import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import { useConfiguracoesSistema } from '@/hooks/useConfiguracoesSistema';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});


export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { data: configs, isError } = useConfiguracoesSistema();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  

  // Get config values with fallbacks (handles errors gracefully)
  const getConfig = (chave: string, fallback: string) => {
    if (isError || !configs) return fallback;
    return configs.find(c => c.chave === chave)?.valor || fallback;
  };

  const feature1 = getConfig('login_feature_1', 'Gestão de Empreendimentos');
  const feature2 = getConfig('login_feature_2', 'Controle de Vendas e Propostas');
  const feature3 = getConfig('login_feature_3', 'Funil de Negociações');
  const copyright = getConfig('copyright_texto', '2024 Seven Group. Todos os direitos reservados.');
  const loginSubtitulo = getConfig('login_subtitulo', 'CRM Imobiliário');
  const loginDescricao = getConfig('login_descricao', 'Plataforma completa para gestão de empreendimentos imobiliários');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      setLoginError(validation.error.errors[0].message);
      return;
    }

    setLoginLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          setLoginError(error.message);
        }
      } else {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setLoginError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Abstract Pattern */}
        <div className="absolute inset-0">
          {/* Wave pattern */}
          <svg 
            className="absolute bottom-0 left-0 w-full h-1/2 opacity-10"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
          >
            <path 
              fill="currentColor" 
              className="text-white"
              d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          <svg 
            className="absolute bottom-0 left-0 w-full h-1/3 opacity-5"
            viewBox="0 0 1440 320" 
            preserveAspectRatio="none"
          >
            <path 
              fill="currentColor" 
              className="text-white"
              d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          {/* Subtle grid */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <p className="text-sm text-slate-500 mb-3 tracking-[0.3em] uppercase font-medium">
            {loginSubtitulo}
          </p>
          <h1 className="text-5xl font-bold text-white text-center tracking-tight">
            Seven Group 360
          </h1>
          <p className="text-slate-400 text-center mt-4 max-w-md">
            {loginDescricao}
          </p>
          
          <div className="mt-16 flex flex-col items-start gap-5 w-full max-w-sm">
            <div className="flex items-center gap-4 text-slate-400">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-sm">{feature1}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-sm">{feature2}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-sm">{feature3}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img 
              src={logo} 
              alt="Seven Group 360" 
              className="w-16 h-16 object-contain mb-3"
            />
            <h2 className="text-xl font-bold">Seven Group 360</h2>
          </div>

          <Card className="border-border shadow-2xl">
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
              <CardDescription className="text-base mt-1">
                Entre com suas credenciais para acessar
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                    {loginError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-sm font-semibold" 
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

            </CardContent>
          </Card>
          
          <p className="text-center text-xs text-muted-foreground mt-8">
            © {copyright}
          </p>
        </div>
      </div>
    </div>
  );
}
