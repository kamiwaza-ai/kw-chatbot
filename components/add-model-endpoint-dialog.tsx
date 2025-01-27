'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useModels } from '@/hooks/use-models';

export function AddModelEndpointDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();
  const { models, isLoading: isLoadingModels, mutate: mutateModels } = useModels();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/model-endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          uri,
          apiKey: apiKey || undefined,
          providerType: 'openai-compatible', // All custom endpoints use OpenAI-compatible format
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add model endpoint');
      }

      // Show success toast
      toast({
        title: 'Success',
        description: 'Model endpoint added successfully',
      });

      // Refresh the models list
      await mutateModels();

      // Clear form and close dialog
      setName('');
      setUri('');
      setApiKey('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to add model endpoint:', error);
      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to add model endpoint',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <PlusIcon size={16} />
          Add Model
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Model Endpoint</DialogTitle>
          <DialogDescription>
            Add a custom OpenAI-compatible model endpoint. The endpoint should support the OpenAI API format.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Model"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="uri">
                URI
                <span className="text-xs text-muted-foreground ml-1">
                  (e.g., http://localhost:8000/v1)
                </span>
              </Label>
              <Input
                id="uri"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="http://localhost:8000/v1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">
                API Key
                <span className="text-xs text-muted-foreground ml-1">(optional)</span>
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Model'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 