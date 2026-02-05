'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { AlertCircle, Eye, EyeOff, Loader2, Check, Trash2, ExternalLink } from 'lucide-react';
import { useClientApiCall } from '@/lib/api-client';
import Image from 'next/image';

interface ServiceCredentials {
  [key: string]: string;
}

interface EditServiceModalProps {
  service: {
    id: string;
    service_name: string;
    environment: string;
    features: Record<string, boolean>;
  };
  trigger: React.ReactNode;
  onDelete?: () => void;
}

// Service configuration
const SERVICE_CONFIG: Record<string, {
  logo: string;
  docsUrl: string;
  fields: { key: string; label: string; placeholder: string }[];
}> = {
  razorpay: {
    logo: '/razorpay.png',
    docsUrl: 'https://razorpay.com/docs/',
    fields: [
      { key: 'RAZORPAY_KEY_ID', label: 'Key ID', placeholder: 'rzp_test_...' },
      { key: 'RAZORPAY_KEY_SECRET', label: 'Key Secret', placeholder: 'Secret key' },
    ],
  },
  paypal: {
    logo: '/paypal.png',
    docsUrl: 'https://developer.paypal.com/docs/',
    fields: [
      { key: 'PAYPAL_CLIENT_ID', label: 'Client ID', placeholder: 'Client ID' },
      { key: 'PAYPAL_CLIENT_SECRET', label: 'Client Secret', placeholder: 'Client secret' },
    ],
  },
  twilio: {
    logo: '/twilio.png',
    docsUrl: 'https://console.twilio.com',
    fields: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'AC...' },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: 'Auth token' },
    ],
  },
  resend: {
    logo: '/resend.png',
    docsUrl: 'https://resend.com/api-keys',
    fields: [
      { key: 'RESEND_API_KEY', label: 'API Key', placeholder: 're_...' },
    ],
  },
};

export function EditServiceModal({ service, trigger, onDelete }: EditServiceModalProps) {
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<ServiceCredentials>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const apiClient = useClientApiCall();
  const config = SERVICE_CONFIG[service.service_name.toLowerCase()] || {
    logo: '',
    docsUrl: '#',
    fields: [],
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const hasCredentials = Object.values(credentials).some(value => value.trim() !== '');
      if (!hasCredentials) {
        throw new Error('Enter at least one credential');
      }

      await apiClient(`/api/services/${service.service_name}/credentials`, {
        method: 'PUT',
        body: JSON.stringify({
          credentials,
          environment: service.environment
        })
      });

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setCredentials({});
        window.location.reload();
      }, 800);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      await apiClient(`/api/services/${service.service_name}`, {
        method: 'DELETE'
      });

      setOpen(false);
      if (typeof onDelete === 'function') {
        onDelete();
      } else {
        window.location.reload();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCredentials({});
    setError(null);
    setSuccess(false);
    setDeleteMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-[#09090b] border-zinc-800/50 text-white p-0 gap-0 w-[calc(100%-2rem)] max-w-md rounded-xl overflow-hidden">
        {/* Visually hidden title for accessibility */}
        <VisuallyHidden.Root>
          <DialogTitle>Edit {service.service_name} credentials</DialogTitle>
        </VisuallyHidden.Root>

        {/* Header */}
        <div className="border-b border-zinc-800/50 px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {config.logo ? (
              <div className="w-5 h-5 rounded overflow-hidden bg-white/5 flex items-center justify-center">
                <Image
                  src={config.logo}
                  alt={service.service_name}
                  width={20}
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-medium">
                {service.service_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium capitalize">{service.service_name}</span>
          </div>
          <a
            href={config.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
          >
            Docs <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Content */}
        <div className="px-4 py-5 space-y-5">
          {/* Environment Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-[10px] font-medium rounded-md ${
              service.environment === 'live'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-blue-500/15 text-blue-400'
            }`}>
              {service.environment.toUpperCase()}
            </span>
            <span className="text-[10px] text-zinc-600">
              Update credentials for {service.environment} mode
            </span>
          </div>

          {/* Delete Confirmation */}
          {deleteMode ? (
            <div className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 font-medium mb-1">
                  Disconnect {service.service_name}?
                </p>
                <p className="text-[10px] text-zinc-500">
                  This removes the service from your account. You can reconnect anytime.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteMode(false)}
                  disabled={deleteLoading}
                  className="flex-1 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleteLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  {deleteLoading ? 'Removing...' : 'Disconnect'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Credential Fields */}
              <div className="space-y-3">
                {config.fields.map((field, index) => (
                  <div key={field.key}>
                    <label className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
                      <span>{field.label}</span>
                      {index === 0 && (
                        <button
                          type="button"
                          onClick={() => setShowSecrets(!showSecrets)}
                          className="text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
                        >
                          {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                  <Check className="w-3 h-3 flex-shrink-0" />
                  Saved successfully
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={loading || success}
                  className="w-full px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
                </button>

                <button
                  onClick={() => setDeleteMode(true)}
                  className="w-full px-4 py-2 text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Disconnect Service
                </button>
              </div>

              <p className="text-[10px] text-zinc-700 text-center">
                Credentials are encrypted with AES-256
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
