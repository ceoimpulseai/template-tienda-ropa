import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { apiFetch } from '../../lib/apiFetch';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      // /auth/register ya deja al usuario autenticado (reenvía el Set-Cookie de sesión).
      // Recarga completa en vez de navigate(): el store reactivo de better-auth tarda un
      // tick en reflejar la sesión nueva y un navigate() inmediato gana la carrera y
      // rebota a /login aunque la sesión ya esté creada.
      await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-4 text-xl font-semibold text-text">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Tu nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="Nombre del negocio"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Crear cuenta
          </Button>
        </form>
        <Link to="/login" className="mt-4 block text-center text-sm text-text-muted hover:text-text">
          ¿Ya tenés cuenta? Iniciá sesión
        </Link>
      </Card>
    </div>
  );
}
