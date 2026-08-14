import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { authClient } from '../../lib/auth-client';

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const { error: signInError } = await authClient.signIn.email(form);
    if (signInError) {
      setError(signInError.message ?? 'No se pudo iniciar sesión');
      return;
    }
    navigate('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-text">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        <Link to="/forgot-password" className="mt-4 block text-center text-sm text-text-muted hover:text-text">
          ¿Olvidaste tu contraseña?
        </Link>
      </Card>
    </div>
  );
}
