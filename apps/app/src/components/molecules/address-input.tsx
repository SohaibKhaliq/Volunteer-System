import { BaseInputProps } from '@/types/form';
import { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../atoms/input';
import { cn } from '@/lib/utils';

interface TextProps extends BaseInputProps {
  value?: Location;
  onChange: (value: Location) => void;
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

const AddressInput = forwardRef<HTMLInputElement, TextProps>((props, ref) => {
  const { t } = useTranslation();
  const { label, optional = false, placeholder } = props;
  
  const [address, setAddress] = useState(props.value?.address || '');

  useEffect(() => {
    if (props.value?.address) {
      setAddress(props.value.address);
    }
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    props.onChange({
      address: newAddress,
      lat: props.value?.lat || 0,
      lng: props.value?.lng || 0
    });
  };

  return (
    <div className={cn('flex flex-col gap-y-2.5')}>
      <div className="font-medium flex flex-col">
        {label && (
          <label>
            {label} {!optional && <span className="text-red-500">*</span>}
          </label>
        )}

        {props.helperText && <span className="text-xs text-gray-500">{props.helperText}</span>}
      </div>

      <Input
        ref={ref}
        value={address}
        onChange={handleChange}
        placeholder={placeholder || t('Enter an address...')}
        className="w-full"
      />
    </div>
  );
});

AddressInput.displayName = 'AddressInput';

export default AddressInput;
