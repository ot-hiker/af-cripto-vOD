import { useState, useEffect } from 'react';
import { Bell, BellOff, Trash2, Search, ChevronUp, ChevronDown, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { alertsApi } from '@/lib/api';
import { useBtcPrice } from '@/hooks/useBtcPrice';
import { formatCurrency, maskEmail } from '@/lib/utils';
import { PriceAlert } from '@/types';

export function Alerts() {
  const { price } = useBtcPrice();
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  const [searchEmail, setSearchEmail] = useState('');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    const price_val = parseFloat(targetPrice.replace(/[^0-9.]/g, ''));
    if (isNaN(price_val) || price_val <= 0) {
      setCreateError('Insira um preço-alvo válido');
      return;
    }

    setCreating(true);
    try {
      const result = await alertsApi.create({
        email,
        target_price: price_val,
        direction,
      });
      setCreateSuccess(result.message);
      setEmail('');
      setTargetPrice('');

      // Refresh alerts list if already searched with this email
      if (searchEmail === email) {
        handleSearch(email);
      }
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleSearch = async (emailToSearch = searchEmail) => {
    if (!emailToSearch) return;
    setLoadingAlerts(true);
    setSearched(true);
    try {
      const data = await alertsApi.getByEmail(emailToSearch);
      setAlerts(data);
    } catch (err) {
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await alertsApi.delete(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const getAlertStatus = (alert: PriceAlert) => {
    if (alert.is_active) return { label: 'Ativo', class: 'text-green-400 bg-green-400/10', icon: Bell };
    if (alert.triggered_at) return { label: 'Disparado', class: 'text-blue-400 bg-blue-400/10', icon: CheckCircle };
    return { label: 'Inativo', class: 'text-muted-foreground bg-muted/50', icon: BellOff };
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Alertas de Preço</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Receba alertas por email quando o BTC atingir o preço alvo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Alert Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Criar Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Current Price Reference */}
              {price && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5">Preço atual do BTC</p>
                  <p className="font-mono font-bold text-lg text-foreground">
                    {formatCurrency(price.usd)}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preço-alvo (USD)</label>
                <Input
                  type="number"
                  placeholder="Ex: 100000"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Condição</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('above')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                      direction === 'above'
                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                        : 'border-border text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    Acima de
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('below')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                      direction === 'below'
                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : 'border-border text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                    Abaixo de
                  </button>
                </div>
              </div>

              {createError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {createError}
                </p>
              )}

              {createSuccess && (
                <p className="text-sm text-green-400 bg-green-400/10 px-3 py-2 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {createSuccess}
                </p>
              )}

              <Button type="submit" disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Criar Alerta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Buscar Meus Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={() => handleSearch()}
                  disabled={loadingAlerts || !searchEmail}
                  size="icon"
                  variant="outline"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          {loadingAlerts ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : searched && alerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum alerta encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const status = getAlertStatus(alert);
                const StatusIcon = status.icon;

                return (
                  <Card key={alert.id} className="hover:border-border/80 transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.class}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {maskEmail(alert.email)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono font-semibold">
                              {formatCurrency(parseFloat(alert.target_price))}
                            </span>
                            <span
                              className={`flex items-center gap-0.5 text-xs ${
                                alert.direction === 'above' ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {alert.direction === 'above' ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              {alert.direction === 'above' ? 'acima' : 'abaixo'}
                            </span>
                          </div>
                          {alert.triggered_at && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Clock className="w-3 h-3" />
                              Disparado em {new Date(alert.triggered_at).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(alert.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
