import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { authClient } from '../../lib/auth-client';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('Link inválido o expirado.');
      return;
    }
    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });
    if (resetError) {
      setError(resetError.message ?? 'No se pudo restablecer la contraseña');
      return;
    }
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-text">Elegí una nueva contraseña</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="Contraseña nueva (mín. 8 caracteres)"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Guardar contraseña
          </Button>
        </form>
      </Card>
    </div>
  );
}
