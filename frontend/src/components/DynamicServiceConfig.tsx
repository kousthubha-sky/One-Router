'use client';

/**
 * @deprecated This component is not currently in use.
 * If needed in the future, it must be updated to use Clerk authentication
 * instead of localStorage API keys.
 */

import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ServiceSchema {
  service: string;
  category?: string;
  subcategory?: string;
  credentials_required: Record<string, CredentialField>;
  endpoints: Record<string, EndpointInfo>;
}

interface CredentialField {
  type: 'string' | 'email' | 'phone' | 'number' | 'password';
  required: boolean;
  secret?: boolean;
}

interface EndpointInfo {
  method: string;
  path: string;
  params: Record<string, string>;
}

interface DynamicServiceConfigProps {
  serviceName: string;
  onSave: (credentials: Record<string, string>) => void;
  onCancel: () => void;
}

function DynamicServiceConfig({ serviceName, onSave, onCancel }: DynamicServiceConfigProps) {
  const { getToken } = useAuth();

  const { data: schema, isLoading, error } = useQuery<ServiceSchema>({
    queryKey: ['service-schema', serviceName],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`/api/v1/services/${serviceName}/schema`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load service schema');
      }
      return res.json();
    },
  });

  const { mutate, isPending, isSuccess, isError } = useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const token = await getToken();
      const res = await fetch(`/api/services/${serviceName}/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        throw new Error('Failed to save configuration');
      }
      return res.json();
    },
    onSuccess: (data) => {
      onSave(data);
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = (data: Record<string, string>) => {
    mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A3FF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-[#ff6b6b]">Failed to load service schema</p>
        </div>
      </div>
    );
  }

  const credentialsFields = schema?.credentials_required || {};
  const availableFeatures = Object.keys(schema?.endpoints || {});

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white">
            Configure {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
          </CardTitle>
          <CardDescription className="text-[#888]">
            {schema?.category} / {schema?.subcategory}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {Object.entries(credentialsFields).map(([key, config]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-[#ccc]">
                  {formatLabel(key)}
                  {config.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={key}
                  type={config.secret ? 'password' : getInputType(config.type)}
                  {...register(key, {
                    required: config.required ? `${formatLabel(key)} is required` : false,
                    pattern: config.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/ : undefined,
                  })}
                  placeholder={getPlaceholder(config.type)}
                  className="bg-[#222] border-[#333] text-white placeholder:text-[#666]"
                />
                {errors[key] && (
                  <p className="text-red-500 text-sm">{errors[key]?.message as string}</p>
                )}
              </div>
            ))}

            <div className="border-t border-[#333] pt-6">
              <h3 className="text-white font-semibold mb-4">Available Features:</h3>
              <div className="flex flex-wrap gap-2">
                {availableFeatures.map(feature => (
                  <div
                    key={feature}
                    className="px-3 py-2 bg-[#222] border border-[#333] rounded-md text-[#00A3FF] text-sm"
                  >
                    {formatFeatureName(feature)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isPending || isSubmitting}
                className="flex-1 bg-[#00A3FF] hover:bg-[#0082CC] text-white"
              >
                {isPending || isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Configuration</span>
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
                className="flex-1 border-[#444] text-[#888] hover:text-white hover:bg-[#333]"
              >
                Cancel
              </Button>
            </div>

            {isSuccess && (
              <div className="mt-4 p-4 bg-[#0f5f3f] border border-[#00A3FF] rounded-md">
                <div className="flex items-center gap-2 text-[#00A3FF]">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Configuration saved successfully!</span>
                </div>
              </div>
            )}

            {isError && (
              <div className="mt-4 p-4 bg-[#3f1a1a] border border-red-500 rounded-md">
                <div className="flex items-center gap-2 text-red-500">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Failed to save configuration</span>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getInputType(type: string): string {
  const typeMap: Record<string, string> = {
    email: 'email',
    phone: 'tel',
    password: 'password',
    number: 'number',
  };
  return typeMap[type] || 'text';
}

function getPlaceholder(type: string): string {
  const placeholderMap: Record<string, string> = {
    email: 'you@example.com',
    phone: '+1234567890',
    password: '•••••••••',
    string: 'Enter value',
    number: 'Enter number',
  };
  return placeholderMap[type] || 'Enter value';
}

function formatFeatureName(feature: string): string {
  return feature
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default DynamicServiceConfig;
