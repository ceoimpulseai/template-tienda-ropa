import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { authClient } from '../../lib/auth-client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-text">Restablecer contraseña</h1>
        {sent ? (
          <p className="text-sm text-text-muted">
            Si el email existe en el sistema, te enviamos un link para elegir una nueva contraseña.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Enviar link
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-4 block text-center text-sm text-text-muted hover:text-text">
          Volver a iniciar sesión
        </Link>
      </Card>
    </div>
  );
}
