import { useState } from 'react';
import { Zap, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi, setAuthToken } from '@/lib/api';

interface LoginProps {
    onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await authApi.login(password);
            if (result.success) {
                setAuthToken(result.token);
                onSuccess();
            } else {
                setError(result.error || 'Senha incorreta');
            }
        } catch {
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Zap className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl font-bold text-foreground">CryptoHub</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Senha de acesso"
                                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
