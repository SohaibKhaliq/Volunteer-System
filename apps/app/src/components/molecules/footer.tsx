import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-200 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-light.svg" alt="Eghata Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold text-white">Eghata</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('Empowering communities through volunteerism. Connect, contribute, and make a difference today.')}
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('Quick Links')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">{t('Home')}</Link></li>
              <li><Link to="/map" className="hover:text-white transition-colors">{t('Find Opportunities')}</Link></li>
              <li><Link to="/organizations" className="hover:text-white transition-colors">{t('Organizations')}</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">{t('About Us')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('Contact')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('Resources')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="hover:text-white transition-colors">{t('Help Center')}</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">{t('Blog')}</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">{t('Privacy Policy')}</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">{t('Terms of Service')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('Contact Us')}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>123 Volunteer Ave, Community City, 12345</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>contact@eghata.org</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Eghata. {t('All rights reserved.')}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('Privacy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('Terms')}</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">{t('Cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
