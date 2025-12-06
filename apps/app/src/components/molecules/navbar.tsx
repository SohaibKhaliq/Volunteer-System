import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface NavbarProps {
  asSubmit?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const Navbar = ({ asSubmit = false, disabled = false, loading = false }: NavbarProps) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 z-40">
      <div className="container mx-auto">
        <Button type={asSubmit ? 'submit' : 'button'} disabled={disabled || loading} className="w-full" size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? t('Submitting...') : t('Submit')}
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
