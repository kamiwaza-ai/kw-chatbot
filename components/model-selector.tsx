// components/model-selector.tsx

'use client';

import * as React from 'react';
import { startTransition } from 'react';
import Cookies from 'js-cookie';
import type { Model } from '@/lib/ai/models';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useModels } from '@/hooks/use-models';
import { cn } from '@/lib/utils';
import { AddModelEndpointDialog } from './add-model-endpoint-dialog';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ModelSelector({
  selectedModelId,
  onModelChange,
  className,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { models, isLoading, error } = useModels();

  console.log('ModelSelector render:', {
    selectedModelId,
    availableModels: models,
    isLoading,
    error
  });

  const selectedModel = React.useMemo(
    () => {
      const found = models.find((model: Model) => model.id === selectedModelId);
      console.log('Selected model:', { selectedModelId, found });
      return found;
    },
    [selectedModelId, models]
  );

  const { kamiwazaModels, customModels } = React.useMemo(() => {
    const result = {
      kamiwazaModels: models.filter((model: Model) => model.type === 'kamiwaza'),
      customModels: models.filter((model: Model) => model.type === 'custom')
    };
    console.log('Filtered models:', result);
    return result;
  }, [models]);

  if (isLoading) {
    return (
      <Button variant="outline" className="md:px-2 md:h-[34px]" disabled>
        Loading models...
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="outline" className="md:px-2 md:h-[34px]" disabled>
        Failed to load models
      </Button>
    );
  }

  const handleModelSelect = (model: Model) => {
    console.log('Model selected:', { model });
    setOpen(false);
    startTransition(() => {
      console.log('Setting cookie and calling onModelChange:', { modelId: model.id });
      Cookies.set('model-id', model.id);
      onModelChange?.(model.id);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild
          className={cn(
            'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
            className,
          )}
        >
          <Button variant="outline" className="md:px-2 md:h-[34px]">
            {selectedModel?.label ?? 'Select a model'}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[300px]">
          <DropdownMenuLabel>Kamiwaza Models</DropdownMenuLabel>
          {kamiwazaModels.map((model: Model) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => handleModelSelect(model)}
              className="gap-4 group/item flex flex-row justify-between items-center"
              data-active={model.id === selectedModelId}
            >
              <div className="flex flex-col gap-1 items-start">
                {model.label}
                {model.description && (
                  <div className="text-xs text-muted-foreground">
                    {model.description}
                  </div>
                )}
              </div>
              <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                <CheckCircleFillIcon />
              </div>
            </DropdownMenuItem>
          ))}

          {customModels.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Custom Models</DropdownMenuLabel>
              {customModels.map((model: Model) => (
                <DropdownMenuItem
                  key={model.id}
                  onSelect={() => handleModelSelect(model)}
                  className="gap-4 group/item flex flex-row justify-between items-center"
                  data-active={model.id === selectedModelId}
                >
                  <div className="flex flex-col gap-1 items-start">
                    {model.label}
                    {model.description && (
                      <div className="text-xs text-muted-foreground">
                        {model.description}
                      </div>
                    )}
                  </div>
                  <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                    <CheckCircleFillIcon />
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AddModelEndpointDialog />
    </div>
  );
}