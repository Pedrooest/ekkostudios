import React, { useState } from 'react';
import { supabase } from './supabase';
import { Button } from './Components';

interface AuthViewProps {
    onSuccess: (user: any) => void;
}

export function AuthView({ onSuccess }: AuthViewProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onSuccess(data.user);
            } else {
                if (!fullName.trim()) throw new Error('Por favor, insira seu nome completo.');
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Ocorreu um erro.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0B0F19] overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse"></div>

            <div className="w-full max-w-md mx-4 sm:mx-0 p-6 sm:p-10 bg-[#111827]/40 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl animate-fade relative overflow-hidden">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <img src="/site-logo.png" alt="EKKO" className="h-40 object-contain" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                        {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                    </h2>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        {isLogin ? 'Acesse o dashboard da EKKO Studios' : 'Junte-se ao time da EKKO Studios'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">Nome Completo</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Seu Nome"
                                className="w-full px-6 py-4 bg-[#0B0F19]/50 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full px-6 py-4 bg-[#0B0F19]/50 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-4">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-6 py-4 bg-[#0B0F19]/50 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all pr-14"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${message.type === 'error' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 !bg-blue-600 !rounded-2xl !font-black !uppercase !tracking-[0.2em] shadow-xl shadow-blue-600/20"
                    >
                        {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Entrar Agora' : 'Cadastrar Perfil')}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-all tracking-widest"
                    >
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já possui uma conta? Faça Login'}
                    </button>
                </div>
            </div>
        </div>
    );
}
