import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';

interface WWCCValidationProps {
  onValidationSuccess?: (data: { valid: boolean; formatted: string; state: string }) => void;
  initialNumber?: string;
  initialState?: string;
}

const AUSTRALIAN_STATES = [
  { value: 'VIC', label: 'Victoria (VIC)' },
  { value: 'NSW', label: 'New South Wales (NSW)' },
  { value: 'QLD', label: 'Queensland (QLD) - Blue Card' },
  { value: 'WA', label: 'Western Australia (WA)' },
  { value: 'SA', label: 'South Australia (SA)' },
  { value: 'TAS', label: 'Tasmania (TAS)' },
  { value: 'NT', label: 'Northern Territory (NT)' },
  { value: 'ACT', label: 'Australian Capital Territory (ACT)' }
];

const STATE_FORMAT_EXAMPLES: Record<string, string> = {
  VIC: '12345678A (8 digits + letter)',
  NSW: 'WWC1234567E (WWC + 7 digits + E/V)',
  QLD: '12345/1 (5-7 digits / 1-2 digits)',
  WA: '123456 (6-7 digits)',
  SA: '1234567 (7 digits)',
  TAS: '12345678 (8 digits)',
  NT: '1234567 (6-8 digits)',
  ACT: '12345678 (8 digits)'
};

export default function WWCCValidator({
  onValidationSuccess,
  initialNumber = '',
  initialState = ''
}: WWCCValidationProps) {
  const [wwccNumber, setWwccNumber] = useState(initialNumber);
  const [state, setState] = useState(initialState);
  const [validationResult, setValidationResult] = useState<{
    valid?: boolean;
    formatted?: string;
    error?: string;
  } | null>(null);

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!wwccNumber || !state) {
        throw new Error('Please enter a WWCC number and select a state');
      }
      const response = await api.validateWWCC(wwccNumber, state);
      return response.data || response;
    },
    onSuccess: (data) => {
      setValidationResult({
        valid: true,
        formatted: data.formatted,
        error: undefined
      });
      onValidationSuccess?.(data);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Validation failed';
      setValidationResult({
        valid: false,
        formatted: undefined,
        error: errorMessage
      });
    }
  });

  const handleValidate = () => {
    setValidationResult(null);
    validateMutation.mutate();
  };

  const handleStateChange = (value: string) => {
    setState(value);
    setValidationResult(null); // Reset validation when state changes
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWwccNumber(e.target.value);
    setValidationResult(null); // Reset validation when number changes
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>WWCC Validation</CardTitle>
        </div>
        <CardDescription>
          Validate Working with Children Check numbers for Australian states and territories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="state">State/Territory</Label>
          <Select value={state} onValueChange={handleStateChange}>
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state or territory" />
            </SelectTrigger>
            <SelectContent>
              {AUSTRALIAN_STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state && (
            <p className="text-sm text-muted-foreground">
              Format: {STATE_FORMAT_EXAMPLES[state]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="wwcc-number">WWCC Number</Label>
          <Input
            id="wwcc-number"
            value={wwccNumber}
            onChange={handleNumberChange}
            placeholder={state ? `e.g., ${STATE_FORMAT_EXAMPLES[state]?.split(' ')[0]}` : 'Select state first'}
            disabled={!state}
          />
        </div>

        <Button
          onClick={handleValidate}
          disabled={!wwccNumber || !state || validateMutation.isLoading}
          className="w-full"
        >
          {validateMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Validate WWCC Number
        </Button>

        {validationResult && (
          <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {validationResult.valid ? (
                    <div>
                      <p className="font-semibold text-green-600">Valid WWCC Number</p>
                      <p className="text-sm mt-1">
                        Formatted: <span className="font-mono">{validationResult.formatted}</span>
                      </p>
                      <p className="text-sm">State: {state}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">Invalid WWCC Number</p>
                      <p className="text-sm mt-1">{validationResult.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm font-semibold mb-2">About WWCC Validation</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Each Australian state has different WWCC number formats</li>
            <li>• Queensland uses "Blue Card" system</li>
            <li>• Validation checks format only, not authenticity</li>
            <li>• Always verify with official state registries</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
